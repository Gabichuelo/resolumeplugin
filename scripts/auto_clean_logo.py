#!/usr/bin/env python3
"""
AETHER-VJ: Limpieza automática de logotipos para pantallas LED (fondo #000000).

Funciones (en < 1.5s y sin modificar originales):
  1. Si el borde exterior es fondo sólido blanco/claro (>= 85% opaco y casi blanco),
     lo elimina por inundación (flood-fill desde bordes) con antialias y descontaminación de color.
     (Respeta tarjetas/etiquetas blancas que ya tienen margen exterior transparente.)
  2. Si hay transparencia y contiene texto/trazos negros o muy oscuros (no contornos finos sobre color),
     los aclara a gris plata LED (~200) para que no desaparezcan sobre fondo negro #000000.
  3. Recorta márgenes transparentes excesivos (deja un 3% de aire).
  4. Pone RGB=(0,0,0) en todo píxel con alpha==0 y limita el lado máximo a 3840 px.
  5. Si es de baja resolución (lado máximo < 950 px) y OpenCV está disponible,
     reescala 2x-3x con alineación geométrica de líneas rectas y esquinas vivas.
"""

import os
import sys
from collections import deque
import numpy as np
from PIL import Image

try:
    import cv2
    HAS_CV2 = True
except Exception:
    HAS_CV2 = False


def remove_solid_light_bg(rgba: np.ndarray) -> np.ndarray:
    h, w = rgba.shape[:2]
    rgb = rgba[:, :, :3].astype(np.float32)
    alpha = rgba[:, :, 3].astype(np.float32)

    # Analizar marco exterior de 2px
    border_mask = np.zeros((h, w), dtype=bool)
    border_mask[:2, :] = True
    border_mask[-2:, :] = True
    border_mask[:, :2] = True
    border_mask[:, -2:] = True

    b_a = alpha[border_mask]
    b_rgb = rgb[border_mask]
    opaque_near_white = (b_a > 240) & (np.min(b_rgb, axis=1) >= 230)
    if float(np.mean(opaque_near_white)) < 0.85:
        return rgba

    # Estimar color exacto de fondo del borde
    bg_col = np.median(b_rgb[opaque_near_white], axis=0)
    dist = np.linalg.norm(rgb - bg_col[None, None, :], axis=2)

    # Flood-fill BFS 4-vecinos desde todo el borde donde el color esté cerca del fondo (dist < 48)
    seed_cand = (dist < 48.0) & (alpha > 15)
    visited = np.zeros((h, w), dtype=bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if seed_cand[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))
    for y in range(1, h - 1):
        for x in (0, w - 1):
            if seed_cand[y, x] and not visited[y, x]:
                visited[y, x] = True
                q.append((y, x))

    while q:
        cy, cx = q.popleft()
        for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and seed_cand[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    # Calcular alfa suave en la banda de transición exterior (20..48) y descontaminar halo blanco
    tol_low, tol_high = 20.0, 48.0
    out_rgb = rgb.copy()
    out_a = alpha.copy()

    # Solo modificar píxeles alcanzados por el flood-fill exterior (y 1px adyacente)
    if HAS_CV2:
        region = cv2.dilate(visited.astype(np.uint8), np.ones((3, 3), dtype=np.uint8)) > 0
    else:
        region = visited

    clear_mask = region & (dist <= tol_low)
    out_a[clear_mask] = 0.0

    edge_mask = region & (dist > tol_low) & (dist < tol_high) & (out_a > 0)
    if np.any(edge_mask):
        t = (dist[edge_mask] - tol_low) / (tol_high - tol_low)
        t = np.clip(t * t * (3.0 - 2.0 * t), 0.03, 1.0)
        e_rgb = out_rgb[edge_mask]
        decontam = (e_rgb - bg_col[None, :] * (1.0 - t[:, None])) / t[:, None]
        out_rgb[edge_mask] = np.clip(decontam, 0.0, 255.0)
        out_a[edge_mask] = np.clip(out_a[edge_mask] * t, 0.0, 255.0)

    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(np.rint(out_rgb), 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(np.rint(out_a), 0, 255).astype(np.uint8)
    return out


def lift_dark_lettering_for_led(rgba: np.ndarray) -> np.ndarray:
    """Aclara trazos/letras negras neutras aisladas sobre transparencia a gris plata LED (~205)."""
    rgb = rgba[:, :, :3].astype(np.float32)
    alpha = rgba[:, :, 3].astype(np.float32)

    trans_ratio = float(np.mean(alpha < 30))
    if trans_ratio < 0.15:
        return rgba

    fg = alpha > 128
    fg_count = int(np.sum(fg))
    if fg_count < 20:
        return rgba

    max_c = np.max(rgb, axis=2)
    min_c = np.min(rgb, axis=2)
    is_dark_neutral = fg & (max_c < 98.0) & ((max_c - min_c) < 28.0)
    dark_count = int(np.sum(is_dark_neutral))
    if dark_count < 30:
        return rgba

    out = rgba.copy()
    mask_lift = np.zeros(alpha.shape, dtype=bool)
    is_colored_bright = fg & ((max_c - min_c) > 35.0)

    if HAS_CV2:
        # Separar componentes oscuros: si un componente NO bordea mayormente con color vivo (o >= 35% de pixels oscuros es texto aislado), aclararlo
        dil_color = cv2.dilate(is_colored_bright.astype(np.uint8), np.ones((5, 5), dtype=np.uint8)) > 0
        num_l, lab, stats, _ = cv2.connectedComponentsWithStats(is_dark_neutral.astype(np.uint8), 8)
        for lbl in range(1, num_l):
            area = int(stats[lbl, 4])
            if area < 4:
                continue
            comp = (lab == lbl)
            touch_ratio = float(np.sum(comp & dil_color)) / float(area)
            if touch_ratio < 0.45:
                mask_lift |= comp
        if np.any(mask_lift):
            mask_lift = (cv2.dilate(mask_lift.astype(np.uint8), np.ones((5, 5), dtype=np.uint8)) > 0) & (alpha > 10) & (max_c < 155.0) & ((max_c - min_c) < 35.0)
    else:
        if float(dark_count) / float(fg_count) >= 0.04:
            mask_lift = (alpha > 10) & (max_c < 120.0) & ((max_c - min_c) < 30.0)

    if np.any(mask_lift):
        luma = np.mean(rgb[mask_lift], axis=1, keepdims=True)
        weight = np.clip((165.0 - luma) / 45.0, 0.0, 1.0)
        target_silver = np.full_like(luma, 215.0)
        lifted = rgb[mask_lift] * (1.0 - weight) + target_silver * weight
        out[mask_lift, :3] = np.clip(np.rint(lifted), 0, 255).astype(np.uint8)
    return out


def trim_transparent_margins(rgba: np.ndarray, pad_frac: float = 0.03) -> np.ndarray:
    a = rgba[:, :, 3]
    ys, xs = np.where(a > 8)
    if len(xs) == 0:
        return rgba
    x0, x1 = int(xs.min()), int(xs.max()) + 1
    y0, y1 = int(ys.min()), int(ys.max()) + 1
    bw, bh = x1 - x0, y1 - y0
    pad = max(2, int(round(max(bw, bh) * pad_frac)))
    h, w = a.shape
    cx0, cy0 = max(0, x0 - pad), max(0, y0 - pad)
    cx1, cy1 = min(w, x1 + pad), min(h, y1 + pad)
    return rgba[cy0:cy1, cx0:cx1].copy()


def _straighten_contour(pts: np.ndarray, work_scale: float, is_tiny: bool = False) -> np.ndarray:
    eps_orig = 0.22 if is_tiny else 0.34
    poly = cv2.approxPolyDP(pts.reshape(-1, 1, 2).astype(np.float32), epsilon=eps_orig * work_scale, closed=True).reshape(-1, 2).astype(np.float64)
    m = len(poly)
    if m < 3:
        return poly

    tan_4 = np.tan(np.radians(4.0))
    min_len = 1.8 * work_scale
    tags, targets = [], []
    for i in range(m):
        p0, p1 = poly[i], poly[(i + 1) % m]
        dx, dy = p1[0] - p0[0], p1[1] - p0[1]
        L = float(np.hypot(dx, dy))
        if L >= min_len and abs(dy) <= abs(dx) * tan_4:
            tags.append("H")
            targets.append(0.5 * (p0[1] + p1[1]))
        elif L >= min_len and abs(dx) <= abs(dy) * tan_4:
            tags.append("V")
            targets.append(0.5 * (p0[0] + p1[0]))
        else:
            tags.append("O")
            targets.append(None)

    snapped = poly.copy()
    max_snap = 0.75 * work_scale
    for i in range(m):
        pe, ne = (i - 1) % m, i
        tp, vp = tags[pe], targets[pe]
        tn, vn = tags[ne], targets[ne]
        cx, cy = snapped[i, 0], snapped[i, 1]
        if tp == "H" and tn == "V":
            cx, cy = vn, vp
        elif tp == "V" and tn == "H":
            cx, cy = vp, vn
        else:
            if tp == "H":
                cy = vp
            elif tn == "H":
                cy = vn
            if tp == "V":
                cx = vp
            elif tn == "V":
                cx = vn
        if abs(cx - poly[i, 0]) <= max_snap:
            snapped[i, 0] = cx
        if abs(cy - poly[i, 1]) <= max_snap:
            snapped[i, 1] = cy

    locked = [False] * m
    for i in range(m):
        p_prev, p_curr, p_next = snapped[(i - 1) % m], snapped[i], snapped[(i + 1) % m]
        d_in, d_out = p_curr - p_prev, p_next - p_curr
        L_in, L_out = float(np.hypot(*d_in)), float(np.hypot(*d_out))
        if L_in < 1e-6 or L_out < 1e-6:
            locked[i] = True
            continue
        dot_v = float(np.clip(np.dot(d_in / L_in, d_out / L_out), -1.0, 1.0))
        theta = float(np.degrees(np.arccos(dot_v)))
        adj_hv = (tags[(i - 1) % m] in ("H", "V")) or (tags[i] in ("H", "V"))
        if theta >= 34.0 or ((L_in >= 2.8 * work_scale or L_out >= 2.8 * work_scale) and theta >= 16.0) or (adj_hv and theta >= 18.0) or theta <= 2.0:
            locked[i] = True

    pts_list = [(snapped[i], locked[i]) for i in range(m)]
    for _ in range(2):
        new_pts = []
        n = len(pts_list)
        for i in range(n):
            a_pt, a_lock = pts_list[i]
            b_pt, b_lock = pts_list[(i + 1) % n]
            if a_lock and b_lock:
                new_pts.append((a_pt, True))
            elif a_lock and not b_lock:
                new_pts.append((a_pt, True))
                new_pts.append((0.25 * a_pt + 0.75 * b_pt, False))
            elif not a_lock and b_lock:
                new_pts.append((0.75 * a_pt + 0.25 * b_pt, False))
            else:
                new_pts.append((0.75 * a_pt + 0.25 * b_pt, False))
                new_pts.append((0.25 * a_pt + 0.75 * b_pt, False))
        pts_list = new_pts
    return np.array([p for p, _ in pts_list], dtype=np.float64)


def upscale_straight_contours(rgba: np.ndarray, scale: float) -> np.ndarray:
    """Reescala imágenes de baja resolución suavizando contornos con líneas rectas y esquinas vivas."""
    h, w = rgba.shape[:2]
    out_w = max(1, int(round(w * scale)))
    out_h = max(1, int(round(h * scale)))
    work_scale = scale * 2.0
    ww = max(1, int(round(w * work_scale)))
    wh = max(1, int(round(h * work_scale)))

    rgb = rgba[:, :, :3].astype(np.float32)
    alpha = rgba[:, :, 3].astype(np.float32) / 255.0

    # Color bleed RGB hacia píxeles transparentes antes de escalar
    valid = alpha > 0.05
    kernel = np.ones((3, 3), dtype=np.float32)
    rgb_bled = rgb.copy()
    for _ in range(6):
        v_f = valid.astype(np.float32)
        wt = cv2.filter2D(v_f, -1, kernel, borderType=cv2.BORDER_REPLICATE)
        need = (~valid) & (wt > 0.5)
        if not np.any(need):
            break
        for c in range(3):
            num = cv2.filter2D(rgb_bled[:, :, c] * v_f, -1, kernel, borderType=cv2.BORDER_REPLICATE)
            ch = rgb_bled[:, :, c]
            ch[need] = num[need] / wt[need]
        valid = valid | need

    rgb_up = cv2.resize(rgb_bled, (out_w, out_h), interpolation=cv2.INTER_CUBIC)
    flat = cv2.bilateralFilter(rgb_up, d=7, sigmaColor=24, sigmaSpace=24)
    flat = cv2.bilateralFilter(flat, d=7, sigmaColor=24, sigmaSpace=24)
    rgb_sharp = np.clip(1.30 * flat - 0.30 * cv2.GaussianBlur(flat, (0, 0), 1.1), 0.0, 255.0)

    # Silueta alfa vectorizada con líneas rectas
    alpha_up = np.clip(cv2.resize(alpha, (ww, wh), interpolation=cv2.INTER_CUBIC), 0.0, 1.0)
    B = (alpha_up >= 0.46).astype(np.uint8) * 255
    pad = 2
    B_pad = cv2.copyMakeBorder(B, pad, pad, pad, pad, cv2.BORDER_CONSTANT, value=0)
    contours, hierarchy = cv2.findContours(B_pad, cv2.RETR_TREE, cv2.CHAIN_APPROX_NONE)
    if hierarchy is not None and len(contours) > 0:
        hier = hierarchy[0]
        min_area = 0.4 * (work_scale ** 2)
        depths = []
        for idx in range(len(contours)):
            d, p = 0, hier[idx][3]
            while p != -1:
                d += 1
                p = hier[p][3]
            depths.append(d)
        order = sorted(range(len(contours)), key=lambda i: depths[i])
        canvas = np.zeros((wh + 2 * pad, ww + 2 * pad), dtype=np.uint8)
        for idx in order:
            c = contours[idx]
            if cv2.contourArea(c) < min_area:
                continue
            _, _, bw, bh = cv2.boundingRect(c)
            vp = _straighten_contour(c, work_scale, is_tiny=(bh < 14.0 * work_scale or bw < 10.0 * work_scale))
            if len(vp) < 3:
                continue
            val = 255 if (depths[idx] % 2 == 0) else 0
            cv2.fillPoly(canvas, [np.rint(vp * 16.0).astype(np.int32).reshape(-1, 1, 2)], val, lineType=cv2.LINE_AA, shift=4)
        alpha_out = np.clip(cv2.resize(canvas[pad : pad + wh, pad : pad + ww].astype(np.float32) / 255.0, (out_w, out_h), interpolation=cv2.INTER_AREA), 0.0, 1.0)
    else:
        alpha_out = np.clip(cv2.resize(alpha, (out_w, out_h), interpolation=cv2.INTER_CUBIC), 0.0, 1.0)

    out = np.zeros((out_h, out_w, 4), dtype=np.uint8)
    out[:, :, :3] = np.clip(np.rint(rgb_sharp), 0, 255).astype(np.uint8)
    out[:, :, 3] = np.clip(np.rint(alpha_out * 255.0), 0, 255).astype(np.uint8)
    return out


def clean_logo(in_path: str, out_path: str):
    im = Image.open(in_path).convert("RGBA")
    rgba = np.array(im, dtype=np.uint8)

    # 1. Quitar fondo blanco sólido exterior si lo hay
    rgba = remove_solid_light_bg(rgba)

    # 2. Aclarar texto/trazos negros neutros si hay transparencia
    rgba = lift_dark_lettering_for_led(rgba)

    # 3. Recortar márgenes transparentes excesivos
    rgba = trim_transparent_margins(rgba, pad_frac=0.03)

    # 4. Reescalar con contornos rectos si es pequeño (< 950 px en su lado mayor)
    h, w = rgba.shape[:2]
    max_side = max(w, h)
    if HAS_CV2 and max_side > 0 and max_side < 950:
        target_scale = min(4.0, max(2.0, 1800.0 / float(max_side)))
        # Redondear a pasos limpios (2.0, 2.5, 3.0, 4.0)
        target_scale = round(target_scale * 2.0) / 2.0
        rgba = upscale_straight_contours(rgba, target_scale)

    # 5. Limitar a 3840 px para seguridad GPU y anular RGB donde alpha == 0
    out_im = Image.fromarray(rgba, "RGBA")
    ow, oh = out_im.size
    if max(ow, oh) > 3840:
        s = 3840.0 / float(max(ow, oh))
        out_im = out_im.resize((max(1, int(round(ow * s))), max(1, int(round(oh * s)))), Image.LANCZOS)
    final_arr = np.array(out_im, dtype=np.uint8)
    final_arr[final_arr[:, :, 3] == 0, :3] = 0

    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    Image.fromarray(final_arr, "RGBA").save(out_path, format="PNG")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.stderr.write("Uso: auto_clean_logo.py <entrada> <salida.png>\n")
        sys.exit(2)
    clean_logo(sys.argv[1], sys.argv[2])
