const buttons = document.querySelectorAll(".button");

for (const button of buttons) {
  button.addEventListener("click", async () => {
    // Agrega la lógica de validación de usuario aquí
    const username = prompt("Ingresa tu nombre de usuario:");
    const password = prompt("Ingresa tu contraseña:");

    try {
      const response = await fetch('http://localhost:3000/users/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      if (response.ok) {
        const responseText = await response.text();

        if (!responseText.trim()) {
          console.error('La respuesta está vacía o no contiene datos JSON válidos.');
          alert('La respuesta está vacía o no contiene datos JSON válidos. Verifica la consola para más detalles.');
          return;
        }

        const data = JSON.parse(responseText);
        // Resto del código...
        alert(`¡Bienvenido, ${data.user.username}! Victorias: ${data.user.victories}`);
        // Realiza la redirección después de la autenticación exitosa
        location.href = "/src/Static/index.html";
      } else {
        console.error(`Error en la solicitud: ${response.status} - ${response.statusText}`);
        alert(`Error en la solicitud: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error(`Error en la solicitud: ${error.message}`);
      alert(`Error en la solicitud: ${error.message}`);
    }
  });
}
