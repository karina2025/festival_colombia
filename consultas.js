// Consultas

// 1. Bandas que empiezan por "A"
db.bandas.find({ nombre: { $regex: /^A/ } });

// 2. Asistentes cuyo nombre contenga "Gómez"
db.asistentes.find({ nombre: { $regex: /Gómez/ } });

// 3. Asistentes que tengan "Rock" en generos_favoritos
db.asistentes.find({ generos_favoritos: "Rock" });

// 4. Agrupar presentaciones por escenario y contar cuántas hay
db.presentaciones.aggregate([
  { $group: { _id: "$escenario", total: { $sum: 1 } } }
]);

// 5. Promedio de duración de presentaciones
db.presentaciones.aggregate([
  { $group: { _id: null, promedio_duracion: { $avg: "$duracion_minutos" } } }
]);


// Funciones en system.js

db.system.js.save({
  _id: "escenariosPorCiudad",
  value: function(ciudad) {
    return db.escenarios.find({ ciudad: ciudad }).toArray();
  }
});

db.system.js.save({
  _id: "bandasPorGenero",
  value: function(genero) {
    return db.bandas.find({ genero: genero, activa: true }).toArray();
  }
});


// Transacciones (requiere rs.initiate() para réplica local)



const session = db.getMongo().startSession();
session.startTransaction();

try {
  db.asistentes.updateOne(
    { nombre: "Juan Pérez" },
    { $push: { boletos_comprados: { escenario: "Tarima Caribe", dia: "2025-06-21" } } },
    { session }
  );

  db.escenarios.updateOne(
    { nombre: "Tarima Caribe" },
    { $inc: { capacidad: -1 } },
    { session }
  );

  session.commitTransaction();
  print("✅ Compra realizada con éxito.");
} catch (error) {
  session.abortTransaction();
  print("❌ Error: " + error);
} finally {
  session.endSession();
}

// REVERSAR TRANSACCIÓN
const session2 = db.getMongo().startSession();
session2.startTransaction();

try {
  db.asistentes.updateOne(
    { nombre: "Juan Pérez" },
    { $pull: { boletos_comprados: { escenario: "Tarima Caribe", dia: "2025-06-21" } } },
    { session: session2 }
  );

  db.escenarios.updateOne(
    { nombre: "Tarima Caribe" },
    { $inc: { capacidad: 1 } },
    { session: session2 }
  );

  session2.commitTransaction();
  print("✅ Reverso exitoso.");
} catch (error) {
  session2.abortTransaction();
  print("❌ Error: " + error);
} finally {
  session2.endSession();
}



// Índices y consultas con índices


// 1. Índice en bandas.nombre y búsqueda
db.bandas.createIndex({ nombre: 1 });
db.bandas.find({ nombre: "Bomba Estéreo" });

// 2. Índice en presentaciones.escenario y conteo
db.presentaciones.createIndex({ escenario: 1 });
db.presentaciones.countDocuments({ escenario: "Tarima Caribe" });

// 3. Índice compuesto en ciudad y edad y consulta
db.asistentes.createIndex({ ciudad: 1, edad: 1 });
db.asistentes.find({ ciudad: "Bogotá", edad: { $lt: 30 } });
