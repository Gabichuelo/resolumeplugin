#!/usr/bin/env node
/**
 * Entrypoint compatible with planecreator-dmx.service (/opt/planecreator/server-dmx.js)
 * Starts GrandDas DMX512 Studio + Hahan SL04 Art-Net Server on ports 3000, 3031, and 5175.
 */
import './server/artnetServer.cjs';
