using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace GrandDasStudio
{
    static class Program
    {
        private const int CONSOLE_PORT = 5175;
        private const string CONSOLE_URL = "http://localhost:5175";

        private static bool IsPortOpen(int port)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect("127.0.0.1", port, null, null);
                    var success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(250));
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        private static string FindNodeExecutable(string baseDir)
        {
            // 1. Portable bundled runtime first (laptops without Node.js installed)
            string bundledNode = Path.Combine(baseDir, "runtime", "node.exe");
            if (File.Exists(bundledNode)) return bundledNode;

            string localNode = Path.Combine(baseDir, "node.exe");
            if (File.Exists(localNode)) return localNode;

            // 2. Standard Windows Node.js installations
            string progFilesNode = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe");
            if (File.Exists(progFilesNode)) return progFilesNode;

            string progFilesX86Node = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe");
            if (File.Exists(progFilesX86Node)) return progFilesX86Node;

            return "node.exe";
        }

        private static string FindBrowserAppExecutable()
        {
            string[] candidates = new string[]
            {
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Microsoft", "Edge", "Application", "msedge.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "Google", "Chrome", "Application", "chrome.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Google", "Chrome", "Application", "chrome.exe")
            };

            foreach (string path in candidates)
            {
                if (File.Exists(path)) return path;
            }
            return null;
        }

        /// <summary>
        /// Browser arguments for a live lighting console:
        /// - shares normal browser session so BroadcastChannel and localStorage sync across all windows
        /// - background throttling OFF => DMX effects keep running when minimized or covered by another window
        /// </summary>
        private static string BuildBrowserArgs()
        {
            return "--app=" + CONSOLE_URL +
                   " --start-maximized" +
                   " --no-first-run" +
                   " --no-default-browser-check" +
                   " --disable-background-timer-throttling" +
                   " --disable-renderer-backgrounding" +
                   " --disable-backgrounding-occluded-windows" +
                   " --disable-features=CalculateNativeWinOcclusion,IntensiveWakeUpThrottling";
        }

        [STAThread]
        static void Main()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string serverScript = Path.Combine(baseDir, "server", "artnetServer.cjs");
            string browserExe = FindBrowserAppExecutable();

            if (!File.Exists(serverScript))
            {
                MessageBox.Show(
                    "No se encontró server\\artnetServer.cjs junto al ejecutable.\nAsegúrate de mantener GrandDas_DMX512_Studio.exe dentro de su carpeta.",
                    "GrandDas DMX512 Studio",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
                return;
            }

            // Start the Art-Net engine silently if it is not already running.
            if (!IsPortOpen(CONSOLE_PORT))
            {
                try
                {
                    string nodeExe = FindNodeExecutable(baseDir);
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = nodeExe,
                        Arguments = "\"" + serverScript + "\"",
                        WorkingDirectory = baseDir,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden
                    });
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "Error al iniciar el motor Art-Net DMX512:\n" + ex.Message,
                        "GrandDas DMX512 Studio",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error);
                    return;
                }

                // Wait up to 8 seconds for the engine to bind port 5175
                for (int i = 0; i < 40; i++)
                {
                    if (IsPortOpen(CONSOLE_PORT)) break;
                    Thread.Sleep(200);
                }
            }

            if (!string.IsNullOrEmpty(browserExe))
            {
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = browserExe,
                        Arguments = BuildBrowserArgs(),
                        UseShellExecute = false
                    });
                    return;
                }
                catch { }
            }

            Process.Start(new ProcessStartInfo { FileName = CONSOLE_URL, UseShellExecute = true });
        }
    }
}
