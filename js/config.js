/* ============ TU CÓDIGO SECRETO DEL RINCÓN ============
   Este es el "nombre de la habitación" privada. Solo quien
   lo conozca (vosotros) podrá ver el chat. Puedes dejarlo
   así o cambiarlo por cualquier combinación de letras y números.
*/
window.SECRET_CODE = "a7F3k9XzQ2Lp8mRn";

/* ============ CLAVES DE FIREBASE ============
   PEPE AQUÍ TU firebaseConfig (ver pasos en DESIGN.md).
   Cuando lo tengas, estos valores ya NO estarán vacíos.
*/
window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA7liGGYG20mu7jd6GoZKQKCRTRvDPQQcg",
  authDomain: "chat-17634.firebaseapp.com",
  databaseURL: "https://chat-17634-default-rtdb.firebaseio.com",
  projectId: "chat-17634",
  storageBucket: "chat-17634.firebasestorage.app",
  messagingSenderId: "1045230573713",
  appId: "1:1045230573713:web:2b71cf2ad7266b84a4c730"
};

/* ============ WEB PUSH (notificaciones con la pestaña cerrada) ============
   La clave pública VAPID la usa el navegador para registrarse y recibir
   notificaciones. La clave privada vive SOLO en el emisor del servidor
   (rama push-funcs), nunca en esta web. */
window.VAPID_PUBLIC = "BOM0UwsfHoYnya9wG0IdzvRy6rQJ2BJSI-JDoBuSCjCe0G4fpZhLIU8yuPhEpmLC5mieQEgXkeNDMcj8Je7JYEk";
window.VAPID_SUBJECT = "mailto:maykool-gabriela@elrincon.app";