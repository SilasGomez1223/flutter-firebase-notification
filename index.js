const express = require("express");
const axios = require("axios");

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

const serviceAccount = require("./firebase-admin-sdk.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const FCM_URL = "https://fcm.googleapis.com/fcm/send";
const SERVER_KEY =
  "AAAAKycZtEY:APA91bGnv-PstKB--pFPxqL9HCLigj9Y0DeFeJGIyd_CXkjmMas7xDw-ICV3YzfrfKDCRgjs17PdZvnFvDwdofGWUFY188-Z7Sv_QotPTeInB93KNunAMwcJDQHeQKpBkV5I0J3cnKDG";

// API Endpoint to handle push notification
app.post("/send-notification", async (req, res) => {
  const { title, body } = req.body;
  try {
    const tokens = await getAllFirebaseTokens();
    tokens.map((token) => {
      const message = {
        to: token,
        notification: {
          body,
          title,
          redirect: "product",
        },
      };
      axios.post(FCM_URL, message, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `key=${SERVER_KEY}`,
        },
      });
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to send notification", status: false });
  }

  res.json({ message: "Notification sent successfully!", status: true });
});

// Retrieve Firebase token from the database
async function getAllFirebaseTokens() {
  const snapshot = await db.collection("token_lists").get();
  let tokens = [];
  snapshot.forEach((doc) => {
    if (doc.data().token) tokens.push(doc.data().token);
  });
  console.log("tokens", tokens);
  return tokens;
}

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
