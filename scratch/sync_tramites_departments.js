const { ConfiguracionPago } = require('../src/models');
const { Op } = require('sequelize');

async function syncData() {
    console.log('--- Iniciando Reparación de Datos de Trámites ---');
    try {
        const mapping = [
            { deptId: 4, categories: ['Obras Municipales', 'Obra Nueva/Ampliación'] },
            { deptId: 5, categories: ['Tránsito y Transporte', 'Licencias'] },
            { deptId: 6, categories: ['Seguridad Pública'] },
            { deptId: 7, categories: ['Educación', 'Certificado de concentración de notas', 'Certificados'] },
            { deptId: 8, categories: ['Salud'] }
        ];

        let totalUpdated = 0;

        for (const item of mapping) {
            const [count] = await ConfiguracionPago.update(
                { departamento_id: item.deptId },
                {
                    where: {
                        categoria: { [Op.in]: item.categories },
                        departamento_id: null // Solo actualizar los que no tienen departamento
                    }
                }
            );
            console.log(`Departamento ID ${item.deptId}: ${count} trámites vinculados.`);
            totalUpdated += count;
        }

        console.log(`--- Reparación completada. Total: ${totalUpdated} trámites actualizados. ---`);
        process.exit(0);
    } catch (error) {
        console.error('Error durante la reparación:', error);
        process.exit(1);
    }
}

syncData();
