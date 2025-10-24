const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  try {
    console.log("Navegando a http://localhost:3000");
    await page.goto("http://localhost:3000", { waitUntil: "networkidle2" });
    
    // Hacer login
    console.log("Haciendo login...");
    await page.type("#email", "admin@municipalidad.cl");
    await page.type("#password", "admin123");
    await page.click("button[type=submit]");
    
    // Esperar a que cargue el dashboard
    await page.waitForTimeout(2000);
    
    // Buscar y hacer clic en el enlace de usuarios
    console.log("Buscando enlace de usuarios...");
    const usuariosLink = await page.$("a[onclick*=usuarios], a[href*=usuarios]");
    
    if (usuariosLink) {
      console.log("Enlace de usuarios encontrado, haciendo clic...");
      await usuariosLink.click();
      await page.waitForTimeout(3000);
      
      // Verificar si aparece la tabla de usuarios
      const tabla = await page.$("#tabla-usuarios");
      if (tabla) {
        const filas = await page.$$("#tabla-usuarios tr");
        console.log(`Tabla de usuarios encontrada con ${filas.length} filas`);
        
        // Verificar si hay datos en la tabla
        if (filas.length > 0) {
          const primeraFila = await page.evaluate(() => {
            const fila = document.querySelector("#tabla-usuarios tr");
            return fila ? fila.textContent : "No hay contenido";
          });
          console.log("Primera fila:", primeraFila);
        }
      } else {
        console.log("No se encontró la tabla de usuarios");
      }
      
      // Probar el botón "Nuevo Usuario"
      console.log("Probando botón Nuevo Usuario...");
      const nuevoBtn = await page.$("button[onclick*=mostrarFormularioUsuario]");
      if (nuevoBtn) {
        await nuevoBtn.click();
        await page.waitForTimeout(2000);
        
        const formulario = await page.$("form");
        if (formulario) {
          console.log(" Formulario de usuario aparece correctamente");
        } else {
          console.log(" Formulario de usuario NO aparece");
        }
      } else {
        console.log(" Botón Nuevo Usuario no encontrado");
      }
    } else {
      console.log(" Enlace de usuarios no encontrado");
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await browser.close();
  }
})();
