const axios = require('axios');

async function test() {
    try {
        const response = await axios.post('http://localhost:3000/api/tramites', {
            titulo: 'Test Reclamo',
            descripcion: 'Test descripcion',
            tipo: 'Reclamos y revisiones de casos de convivencia escolar',
            departamento_id: 7,
            municipalidad_id: 1,
            prioridad: 'media'
        }, {
            headers: {
                // I need a valid token. Since I don't have one, I'll try to run this from within the app context if possible, 
                // or just look at the code more deeply.
            }
        });
        console.log(response.data);
    } catch (error) {
        console.error(error.response ? error.response.data : error.message);
    }
}
// test();
