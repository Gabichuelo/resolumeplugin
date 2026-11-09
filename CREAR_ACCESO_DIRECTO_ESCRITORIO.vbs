Set WshShell = CreateObject("WScript.Shell")
strDesktop = WshShell.SpecialFolders("Desktop")
Set oShellLink = WshShell.CreateShortcut(strDesktop & "\GrandDas DMX512 Studio.lnk")
oShellLink.TargetPath = "f:\APPS\PRUEBA\INICIAR_GRANDDAS_CONSOLA_APP.bat"
oShellLink.WindowStyle = 7
oShellLink.IconLocation = "shell32.dll, 137"
oShellLink.Description = "Consola de Iluminacion Profesional GrandDas DMX512 + Hahan SL04"
oShellLink.WorkingDirectory = "f:\APPS\PRUEBA"
oShellLink.Save
