const dns = require('node:dns');
const mongoose = require('mongoose');

if (process.env.DNS_SERVERS) {
  dns.setServers(
    process.env.DNS_SERVERS.split(',')
      .map((servidor) => servidor.trim())
      .filter(Boolean)
  );
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI no está definida. Cree un archivo .env a partir de .env.example.');
  }

  mongoose.set('strictQuery', true);

  try {
    const connection = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });

    console.log(`MongoDB conectado: ${connection.connection.host}/${connection.connection.name}`);

    return connection;
  } catch (error) {
    if (/auth/i.test(error.message)) {
      throw new Error(
        'No se pudo autenticar en MongoDB Atlas. Verifique el usuario y la contraseña de MONGODB_URI en .env.'
      );
    }
    if (/ECONNREFUSED|ENOTFOUND|ETIMEOUT|Server selection timed out/i.test(error.message)) {
      throw new Error(
        'No se pudo conectar a MongoDB Atlas. Verifique su conexión, la IP autorizada en Network Access y la cadena MONGODB_URI.'
      );
    }
    throw error;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('Conexión a MongoDB cerrada.');
  }
};

module.exports = { connectDB, disconnectDB };
