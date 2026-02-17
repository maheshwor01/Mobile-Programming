// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  push,
  update,
  remove,
  onValue,
  get
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";

// 🔥 Replace with your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDdCRaKUcMnfMPSF9j_gzexe7Hx0geOxUc",
    authDomain: "testproject-22277.firebaseapp.com",
    projectId: "testproject-22277",
    storageBucket: "testproject-22277.firebasestorage.app",
    messagingSenderId: "453096943439",
    appId: "1:453096943439:web:6fd87a45c7bc64ea505f3a",
    measurementId: "G-YKY4G69SLN"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
console.log("Firebase initialized successfully!", database);

// Reference to "users" node
const usersRef = ref(database, "users");

// DOM Elements
const form = document.getElementById("userForm");
const firebaseIdInput = document.getElementById("firebaseId");
const tableBody = document.getElementById("userTableBody");

// CREATE & UPDATE USER
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const userData = {
      userId: document.getElementById("userId").value.trim(),
      firstName: document.getElementById("firstName").value.trim(),
      lastName: document.getElementById("lastName").value.trim(),
      email: document.getElementById("email").value.trim(),
      address: document.getElementById("address").value.trim(),
      age: parseInt(document.getElementById("age").value),
      gender: document.getElementById("gender").value
    };

    const firebaseId = firebaseIdInput.value;

    if (firebaseId) {
      // Update existing user
      await update(ref(database, "users/" + firebaseId), userData);
      alert("User updated successfully!");
    } else {
      // Create new user
      const newUserRef = push(usersRef);
      await set(newUserRef, userData);
      alert("User added successfully!");
    }

    form.reset();
    firebaseIdInput.value = "";

  } catch (error) {
    console.error("Error saving user:", error);
    alert("Error saving data. Check console.");
  }
});

// READ USERS (Realtime)
onValue(usersRef, (snapshot) => {
  tableBody.innerHTML = "";

  if (!snapshot.exists()) {
    tableBody.innerHTML = "<tr><td colspan='5'>No Users Found</td></tr>";
    return;
  }

  snapshot.forEach((childSnapshot) => {
    const data = childSnapshot.val();
    const key = childSnapshot.key;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${data.userId}</td>
      <td>${data.firstName} ${data.lastName}</td>
      <td>${data.email}</td>
      <td>${data.age}</td>
      <td>
        <button onclick="editUser('${key}')">Edit</button>
        <button onclick="deleteUser('${key}')">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
  });
});

// EDIT USER
window.editUser = async function (id) {
  try {
    const snapshot = await get(ref(database, "users/" + id));

    if (snapshot.exists()) {
      const data = snapshot.val();

      firebaseIdInput.value = id;
      document.getElementById("userId").value = data.userId;
      document.getElementById("firstName").value = data.firstName;
      document.getElementById("lastName").value = data.lastName;
      document.getElementById("email").value = data.email;
      document.getElementById("address").value = data.address;
      document.getElementById("age").value = data.age;
      document.getElementById("gender").value = data.gender;
    }
  } catch (error) {
    console.error("Error editing user:", error);
  }
};

// DELETE USER
window.deleteUser = async function (id) {
  if (confirm("Are you sure you want to delete this user?")) {
    try {
      await remove(ref(database, "users/" + id));
      alert("User deleted successfully!");
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }
};
