import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// إعدادات فايربيس الخاصة بك
const firebaseConfig = {
    apiKey: "AIzaSyA8mfw8bl9ZhdvEoIK5BbgA7Auv1-FHcvw",
    authDomain: "naji-nouri-platform.firebaseapp.com",
    projectId: "naji-nouri-platform",
    storageBucket: "naji-nouri-platform.firebasestorage.app",
    messagingSenderId: "961146979515",
    appId: "1:961146979515:web:3efae492da30ed15aed59e"
};

// تهيئة فايربيس
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// دالة جلب البيانات من فايربيس
async function fetchData(categoryName) {
    const displayArea = document.getElementById('displayArea');
    displayArea.innerHTML = "<div id='status-msg'>جاري تحميل الدروس...</div>";

    try {
        const q = query(collection(db, "lessons"), where("category", "==", categoryName));
        const querySnapshot = await getDocs(q);

        displayArea.innerHTML = "";

        if (querySnapshot.empty) {
            displayArea.innerHTML = "<div id='status-msg'>لا توجد دروس مضافة في هذا القسم حالياً.</div>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            displayArea.innerHTML += `
                <div class="card">
                    <h3>${data.title}</h3>
                    <a href="${data.link}" target="_blank" class="btn-link">فتح ملف الدرس (PDF)</a>
                </div>
            `;
        });

    } catch (error) {
        console.error("Firebase Error: ", error);
        displayArea.innerHTML = `<div id='status-msg' style='color: red;'>حدث خطأ! تأكد من إعدادات Rules في Firebase.</div>`;
    }
}

// جعل الدالة متاحة عالمياً ليتمكن الـ HTML من التعرف عليها عند الضغط على الأزرار
window.fetchData = fetchData;