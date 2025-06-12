require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configurar conexión con PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

//verificar conexion con el servidor
pool.connect()
  .then(() => {
    console.log("Conexión a la base de datos establecida con éxito");
  })
  .catch((err) => {
    console.error("Error al conectar con la base de datos:", err);
    process.exit(1); // Salir con error si no se puede conectar
  });

// Rutas API

// Obtener todos los empleados NOO
app.get('/empleados', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM empleado ORDER BY id_empleado ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener empleados');
  }
});

//Agregar un nuevo empleado NOO
app.post("/empleados", async (req, res) => {
  const { nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo } =
    req.body;

  if (
    !nombre ||
    !apellido ||
    !edad ||
    !fecha_nacimiento ||
    !telefono ||
    !correo ||
    !cargo
  ) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO empleado (nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo, fecha_contratacion) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en el servidor:", err);
    res
      .status(500)
      .json({ error: "Error interno del servidor al agregar empleado" });
  }
});

// Actualizar un empleado existente NOO
app.patch('/empleados/:id_empleado', async (req, res) => {
  const { id_empleado } = req.params;
  const {telefono, correo, cargo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE empleado
       SET telefono = $1,
           correo = $2,
           cargo = $3,
       WHERE id_empleado = $4
       RETURNING *`,
      [telefono, correo, cargo, id_empleado]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Empleado no encontrado");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el empleado');
  }
});

//Obtener todos los platos del menú SII

app.get('/menu', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        codplatillo AS "CodPlatillo",
        nombre AS "Nombre",
        descripcion AS "Descripcion",
        valor AS "Valor",
        linkimagen AS "LinkImagen"
      FROM platillo
      WHERE habilitado = TRUE
    `);

    console.log("Datos obtenidos:", result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error("🔥 ERROR al obtener menú:", err);
    res.status(500).send('Error interno del servidor');
  }
});

//obtener todas las comandas NOO
app.get('/comandas', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        e.nombre AS nombre_empleado,
        ms.numero AS numero_mesa,
        c.id_estado AS estado_comanda,
        c.fecha_pedido,
        c.fecha_entrega,
        c.detalles
      FROM 
        comanda c
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las comandas');
  }
});

//Agregar nueva comanda  

//app.post('/comandas', async (req, res) => {
//  const { CodUsuario, CodMesa, CodEstadoPedido, Detalles } = req.body;
//
//  try {
//    const query = `
//      INSERT INTO Pedido (CodUsuario, CodMesa, CodEstadoPedido, Fecha, Hora, Valor)
//      VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIME, 0)
//      RETURNING CodPedido;
//    `;
//
//    const result = await pool.query(query, [CodUsuario, CodMesa, CodEstadoPedido]);
//
//    const nuevoPedidoId = result.rows[0].codpedido;
//
//    console.log("Pedido creado:", result.rows[0]);
//
//    res.status(201).json({ CodPedido: nuevoPedidoId });
//  } catch (err) {
//    console.error("Error al agregar la comanda:", err);
//    res.status(500).send("Error al agregar la comanda");
//  }
//});

app.post('/comandas', async (req, res) => {
  const { CodUsuario, CodMesa, CodEstadoPedido } = req.body;

  try {
    const result = await pool.query(`
      INSERT INTO pedido (
        CodUsuario, CodMesa, CodEstadoPedido, Fecha, Hora, Valor
      ) VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIME, 0)
      RETURNING CodPedido;
    `, [CodUsuario, CodMesa, CodEstadoPedido]);

    const nuevoPedidoId = result.rows[0].codpedido;
    res.status(201).json({ CodPedido: nuevoPedidoId });
  } catch (err) {
    console.error("Error al agregar la comanda:", err);
    res.status(500).send("Error al agregar la comanda");
  }
});

// Ruta para actualizar el estado de la comanda NOO
//app.put('/comandas/:id_numero_orden', (req, res) => {
//  const { id_numero_orden } = req.params;
//  const { id_estado } = req.body;

//  if (typeof id_estado !== 'number' ) {
//    return res.status(400).json({ error: 'Estado inválido' });
//  }

//  const query = 'UPDATE comanda SET id_estado = $1 WHERE id_numero_orden = $2';

//  pool.query(query, [id_estado, id_numero_orden], (error, results) => {
//    if (error) {
//      console.error('Error al actualizar el estado:', error);
//      return res.status(500).json({ error: 'Error al actualizar el estado' });
//    }

//    if (results.rowCount > 0) {
//      res.status(200).json({ message: `Estado de la comanda actualizado a ${id_estado}` });
//    } else {
//      res.status(404).json({ message: 'Comanda no encontrada' });
//    }
//  });
//});

app.put('/pedido/:CodPedido', async (req, res) => {
  const { CodPedido } = req.params;
  const { CodEstadoPedido } = req.body;

  if (typeof CodEstadoPedido !== 'number') {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const query = `
    UPDATE pedido
    SET CodEstadoPedido = $1
    WHERE CodPedido = $2
  `;

  try {
    const result = await pool.query(query, [CodEstadoPedido, CodPedido]);

    if (result.rowCount > 0) {
      res.status(200).json({ message: `Estado del pedido ${CodPedido} actualizado a ${CodEstadoPedido}` });
    } else {
      res.status(404).json({ message: 'Pedido no encontrado' });
    }
  } catch (error) {
    console.error('Error al actualizar el estado del pedido:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar comanda por id NOO
app.delete('/comandas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM comanda WHERE id_numero_orden = $1 RETURNING *',
      [id]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: `Comanda con id ${id} eliminada` });
    } else {
      res.status(404).json({ message: `Comanda con id ${id} no encontrada` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar la comanda');
  }
});

//Obtener todos los empleados que son "Meseros/as" SII
app.get('/meseros', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.CodUsuario AS "CodUsuario", u.Nombre AS "Nombre"
      FROM Usuario u
      JOIN RolUsuario ru ON u.CodRolUsuario = ru.CodRolUsuario
      WHERE ru.RolUsuario = 'Camarero'
      ORDER BY u.CodUsuario ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener meseros:', err);
    res.status(500).send('Error al obtener meseros');
  }
});

// Obtener ventas por mesero NOO
app.get('/reporte/ventas-meseros', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT e.nombre, COUNT(c.id_numero_orden) AS total_ventas
       FROM comanda c
       JOIN empleado e ON c.id_empleado = e.id_empleado
       GROUP BY e.nombre
       ORDER BY total_ventas DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo ventas por mesero:", err);
    res.status(500).send("Error al obtener las ventas por mesero");
  }
});

// Obtener platos más pedidos NOO
app.get('/reporte/platos-mas-pedidos', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.nombre_plato, COUNT(c.id_plato) AS total_pedidos
       FROM comanda c
       JOIN menu m ON c.id_plato = m.id_plato
       GROUP BY m.nombre_plato
       ORDER BY total_pedidos DESC
       LIMIT 10`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo platos más pedidos:", err);
    res.status(500).send("Error al obtener los platos más pedidos");
  }
});

// Obtener ventas totales por día NOO
app.get('/reporte/ventas-totales', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT CAST(c.fecha_pedido AS DATE) AS fecha, 
              SUM(m.precio * c.cantidad) AS total_ventas
       FROM comanda c
       JOIN menu m ON c.id_plato = m.id_plato
       GROUP BY fecha
       ORDER BY fecha DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error obteniendo ventas totales:", err);
    res.status(500).send("Error al obtener las ventas totales");
  }
});
/////////////////////////////////////////////////////// SII
app.get('/mesa', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        CodMesa AS "CodMesa", 
        Numero AS "Numero", 
        CantidadSillas AS "CantidadSillas" 
      FROM mesa
      ORDER BY CodMesa ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener mesas:', err);
    res.status(500).send('Error al obtener mesas');
  }
});
////////////////////////////////////////////////// NOO
app.post('/mesa', async (req, res) => {
  const { numero, capacidad } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO mesa (numero, capacidad) VALUES ($1, $2) RETURNING *',
      [numero, capacidad]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar la mesa');
  }
});
////////////////////////////////////////////// NOO
//app.get('/estado', async (req, res) => {
//  try {
//    const result = await pool.query('SELECT * FROM estado ORDER BY id_estado ASC');
//    res.json(result.rows);
//  } catch (err) {
//    console.error(err);
//    res.status(500).send('Error al obtener estados');
//  }
//});

app.get('/estado', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM estado ORDER BY id_estado ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener estados');
  }
});

/////////////////////////////////////////////// NOO
app.get("/empleados1", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_empleado, nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo, 
      TO_CHAR(fecha_contratacion, 'YYYY-MM-DD') AS fecha_contratacion FROM empleado ORDER BY id_empleado ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener empleados");
  }
});

// Actualizar un empleado existente NOO
app.patch('/empleados1/:id_empleado', async (req, res) => {
  const { id_empleado } = req.params;
  const { nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo } = req.body;

  try {
    const result = await pool.query(
      `UPDATE empleado
       SET nombre = $1,
           apellido = $2,
           edad = $3,
           fecha_nacimiento = $4,
           telefono = $5,
           correo = $6,
           cargo = $7
       WHERE id_empleado = $8
       RETURNING *`,
      [nombre, apellido, edad, fecha_nacimiento, telefono, correo, cargo, id_empleado]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Empleado no encontrado");
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar el empleado');
  }
});
/////////////////////////////////////////////// NOO
app.get('/comandas1', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        c.id_estado,
        e.nombre AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        c.fecha_pedido,
        c.fecha_entrega,
        est.nombre_estado AS estado
      FROM 
        comanda c
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        detalle d ON c.id_numero_orden = d.id_numero_orden
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      JOIN
        estado est ON c.id_estado = est.id_estado
      ORDER BY c.fecha_pedido DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las comandas');
  }
});
/////////////////////////////////////////////// NOO
app.get('/comandas2', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_numero_orden,
        c.id_estado,
        est.nombre_estado AS estado,
        e.nombre AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        c.fecha_pedido,
        c.fecha_entrega,
        COALESCE(c.detalles, 'Sin detalles') AS detalles
      FROM 
        detalle d
      JOIN 
        comanda c ON d.id_numero_orden = c.id_numero_orden
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      JOIN
        estado est ON c.id_estado = est.id_estado
      ORDER BY c.fecha_pedido DESC`

    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las comandas con detalles');
  }
});
/////////////////////////////////////////////// NOO
app.get('/comandas3', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_numero_orden,
        e.nombre AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        d.id_estado AS estado_detalle,
        c.fecha_pedido,
        c.fecha_entrega,
        c.detalles
      FROM detalle d
      JOIN
        comanda c ON d.id_numero_orden = c.id_numero_orden
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      ORDER BY id_detalle ASC`);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener detalles');
}
});

//guardar fecha de entrega comanda NOO
app.put('/comandas3/:id', async (req, res) => {
  const { id } = req.params;
  const { estado_detalle } = req.body;

  try {
    const result = await pool.query(
      `UPDATE detalle 
       SET id_estado = $1
       WHERE id_detalle = $2 RETURNING *`, 
      [estado_detalle, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Comanda no encontrada" });
    }

    res.json({ message: "Estado actualizado correctamente", comanda: result.rows[0] });
  } catch (error) {
    console.error("Error al actualizar la comanda:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});
///////////////////////////////////////////// NOO
//app.get('/detalle', async (req, res) => {
//  try {
//    const result = await pool.query(
//      `SELECT 
//        d.id_detalle,
//        d.id_numero_orden,
//        e.nombre || ' ' || e.apellido AS nombre_empleado,
//        mn.nombre_plato,
//        ms.numero AS numero_mesa,
//        d.cantidad,
//        d.id_estado AS estado_detalle,
//        c.fecha_pedido,
//        c.fecha_entrega,
//        c.detalles
//      FROM detalle d
//      JOIN
//        comanda c ON d.id_numero_orden = c.id_numero_orden
//      JOIN 
//        empleado e ON c.id_empleado = e.id_empleado
//      JOIN
//        menu mn ON d.id_plato = mn.id_plato
//      JOIN
//        mesa ms ON c.id_mesa = ms.id_mesa
//      ORDER BY id_detalle ASC`);
//    res.json(result.rows);
//  } catch (err) {
//    console.error(err);
//    res.status(500).send('Error al obtener detalles');
//  }
//});

app.get('/detalle', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.CodDetalles,
        d.CodPedido,
        u.Nombre AS nombre_empleado,
        p.Nombre AS nombre_plato,
        m.Numero AS numero_mesa,
        d.Cantidad,
        d.CodEstadoPedido AS estado_detalle,
        d.Detalles AS detalle_plato,
        pe.Fecha,
        pe.Hora,
        pe.Detalles AS detalle_comanda
      FROM detalles d
      JOIN pedido pe ON d.CodPedido = pe.CodPedido
      JOIN usuario u ON pe.CodUsuario = u.CodUsuario
      JOIN platillo p ON d.CodPlatillo = p.CodPlatillo
      JOIN mesa m ON pe.CodMesa = m.CodMesa
      ORDER BY d.CodDetalles ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener detalles:', err);
    res.status(500).send('Error al obtener detalles');
  }
});
//////////////////////////////////////////////// NOO
//app.post('/detalle', async (req, res) => {
//  const { id_numero_orden, id_plato, cantidad, id_estado } = req.body;
//  try {
//    const result = await pool.query(
//      'INSERT INTO detalle (id_plato, id_numero_orden, cantidad, id_estado) VALUES ($1, $2, $3, $4) RETURNING *',
//      [id_plato, id_numero_orden, cantidad, id_estado]
//    );
//    res.status(201).json(result.rows[0]);
//  } catch (err) {
//    console.error(err);
//    res.status(500).send('Error al agregar el detalle');
//  }
//} );

app.post('/detalle', async (req, res) => {
  const { CodPedido, CodPlatillo, Cantidad, CodEstadoPedido, Detalles } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO detalles (CodPlatillo, CodPedido, Cantidad, CodEstadoPedido, Detalles)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [CodPlatillo, CodPedido, Cantidad, CodEstadoPedido, Detalles || 'Sin observaciones']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al agregar el detalle:', err);
    res.status(500).send('Error al agregar el detalle');
  }
});
////////////////////////////////////////////////// NOO
//app.put('/detalle/:id_detalle', async (req, res) => {
//  const { id_detalle } = req.params;
//  const { id_estado } = req.body;
//
//  try {
//    const query1 = `
//      UPDATE detalle
//      SET id_estado = $1
//      WHERE id_detalle = $2;
//    `;
//
//    const values1 = [id_estado, id_detalle];
//    await pool.query(query1, values1);
//
//    const query2 = `
//      UPDATE comanda
//      SET fecha_entrega = CURRENT_TIMESTAMP - INTERVAL '3 hours'
//      WHERE id_numero_orden = (
//        SELECT id_numero_orden FROM detalle WHERE id_detalle = $1
//      )
//      RETURNING *;
//    `;
//      const values2 = [id_detalle];
//      const result = await pool.query(query2, values2);
//
//      res.status(200).json(result.rows[0]);
//  } catch (err) {
//    console.error(err);
//    res.status(500).send('Error al actualizar el detalle');
//  }
//});

app.put('/detalle/:CodDetalle', async (req, res) => {
  const { CodDetalle } = req.params;
  const { CodEstadoPedido } = req.body;

  try {
    // 1. Actualizar estado del detalle
    const query1 = `
      UPDATE detalle
      SET CodEstadoPedido = $1
      WHERE CodDetalle = $2;
    `;
    await pool.query(query1, [CodEstadoPedido, CodDetalle]);

    // 2. Actualizar hora de entrega en Pedido si corresponde
    const query2 = `
      UPDATE pedido
      SET Hora = CURRENT_TIMESTAMP
      WHERE CodPedido = (
        SELECT CodPedido FROM detalle WHERE CodDetalle = $1
      )
      RETURNING *;
    `;
    const result = await pool.query(query2, [CodDetalle]);

    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error al actualizar el detalle:', err);
    res.status(500).send('Error al actualizar el detalle');
  }
});
////////////////////////////////////////// NO
app.put('/detalle', async (req, res) => {
  const { CodPedido } = req.body;

  try {
    const result = await pool.query(
      `UPDATE detalle
       SET CodEstadoPedido = 5
       WHERE CodPedido = $1
       AND CodEstadoPedido <> 6
       RETURNING *;`,
      [CodPedido]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error al actualizar el detalle:', err);
    res.status(500).send('Error al actualizar el detalle');
  }
});

// Comandas con todos sus detalles "Entregados" o "Cancelados" NOO
app.get('/comandas/pagar', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        e.nombre || ' ' || e.apellido AS nombre_empleado,
        c.id_mesa,
        c.id_estado
       FROM comanda c
       JOIN empleado e ON c.id_empleado = e.id_empleado
       WHERE NOT EXISTS (
        SELECT 1
        FROM detalle d
        WHERE d.id_numero_orden = c.id_numero_orden
        AND d.id_estado NOT IN (3, 6)
       )
       AND c.id_estado NOT IN (5, 6)
       AND NOT EXISTS (
        SELECT 1
        FROM detalle d
        WHERE d.id_numero_orden = c.id_numero_orden
        GROUP BY d.id_numero_orden
        HAVING COUNT(DISTINCT d.id_estado) = 1 AND MAX(d.id_estado) = 6
      );`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las comandas');
  }
});
////////////////////////////////////////// NOO
app.get('/comandas/pagar1', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        c.id_numero_orden,
        e.nombre || ' ' || e.apellido AS nombre_empleado,
        c.id_mesa,
        c.id_estado
       FROM comanda c
       JOIN empleado e ON c.id_empleado = e.id_empleado
       WHERE c.id_estado NOT IN(5,6)
       AND NOT EXISTS (
        SELECT 1
        FROM detalle d
        WHERE d.id_numero_orden = c.id_numero_orden
        GROUP BY d.id_numero_orden
        HAVING COUNT(DISTINCT d.id_estado) = 1 AND MAX(d.id_estado) = 6
      );`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las comandas');
  }
});
///////////////////////////////////////////////////////// NOO
app.get('/ventas/:id_numero_orden', async (req, res) => {
  const {id_numero_orden} = req.params;

  try {
    const query = `
    SELECT 
        d.id_detalle,
        e.nombre || ' ' || e.apellido AS nombre_empleado,
        c.id_mesa AS numero_mesa,
        d.id_estado,
        d.cantidad,
        m.nombre_plato,
        m.precio_unitario,
        CAST((d.cantidad * m.precio_unitario) AS INT) AS total_parcial
    FROM detalle d
    JOIN menu m ON d.id_plato = m.id_plato
    JOIN comanda c ON d.id_numero_orden = c.id_numero_orden
    JOIN empleado e ON c.id_empleado = e.id_empleado
    WHERE d.id_numero_orden = $1 AND d.id_estado != 6;`;

    const result = await pool.query(query, [id_numero_orden]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "No se encontraron detalles para esta comanda." });
    }

    const totalFactura = result.rows.reduce((acc, item) => acc + item.total_parcial, 0);

    res.status(200).json({
      id_numero_orden,
      detalles: result.rows,
      totalFactura
  });
  } catch (error) {
    console.error("Error al generar la factura:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});
//////////////////////////////////////////////// NOO
app.post('/ventas', async (req, res) => {
  const { id_numero_orden, comanda } = req.body;
  try {
    const venta = await pool.query(
      `INSERT INTO venta (id_numero_orden, comanda) VALUES ($1, 0) RETURNING *`,
      [id_numero_orden]
    );

    const ventaId = venta.rows[0].id;
    let total = 0;

    for(let item of comanda ) {
      const subtotal = item.cantidad * item.precio_unitario;
      total += subtotal;

      await pool.query(
        `INSERT INTO detalles_venta (factura_id, producto, cantidad, precio , subtotal) VALUES ($1, $2, $3, $4, $5)`,
        [ventaId, item.producto, item.cantidad, item.precio_unitario, subtotal]
      );
    }

    await pool.query(
      `UPDATE ventas SET total = $1 WHERE id = $2`
      [total, ventaId]
    );

    res.json({message:"Factura creada", ventaId});
  } catch (error) {
      res.status(500).json({error: error.message});
  }
});
//////////////////////////////////////////////// NOO
app.get('/comandas4', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        d.id_detalle,
        d.id_numero_orden,
        c.id_estado,
        est.nombre_estado AS estado,
        CONCAT(e.nombre, ' ', e.apellido ) AS nombre_empleado,
        mn.nombre_plato,
        ms.numero AS numero_mesa,
        d.cantidad,
        c.fecha_pedido,
        mn.precio_unitario,
        c.fecha_entrega,
        COALESCE(c.detalles, 'Sin detalles') AS detalles
      FROM 
        detalle d
      JOIN 
        comanda c ON d.id_numero_orden = c.id_numero_orden
      JOIN 
        empleado e ON c.id_empleado = e.id_empleado
      JOIN
        menu mn ON d.id_plato = mn.id_plato
      JOIN
        mesa ms ON c.id_mesa = ms.id_mesa
      JOIN
        estado est ON c.id_estado = est.id_estado
      ORDER BY c.id_numero_orden ASC`

    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener las comandas con detalles');
  }
});
///////////////////////////////////////////// NOO
app.get('/detalle/:id_numero_orden', async (req, res) => {
  const {id_numero_orden} = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM detalle WHERE id_numero_orden = $1", 
      [id_numero_orden]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener detalles');
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});