import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// ضع بيانات الـ Firebase الخاصة بك هنا
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "naji-nouri-platform.firebaseapp.com",
    projectId: "naji-nouri-platform",
    storageBucket: "naji-nouri-platform.firebasestorage.app",
    messagingSenderId: "961146979515",
    appId: "1:961146979515:web:3efae492da30ed15aed59e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const displayArea = document.getElementById("displayArea");
const buttons = document.querySelectorAll(".nav-btn:not(#show-favorites)");
const favButton = document.getElementById("show-favorites");
const searchInput = document.getElementById("searchInput");
const themeToggle = document.getElementById("theme-toggle");
const scrollTopBtn = document.getElementById("scrollTopBtn");

// State Management
let currentLessons = [];
let savedFavorites = JSON.parse(localStorage.getItem("favorites")) || [];

// 1. Dark Mode Logic
const currentTheme = localStorage.getItem("theme") || "light";
document.documentElement.setAttribute("data-theme", currentTheme);
updateThemeIcon(currentTheme);

themeToggle.addEventListener("click", () => {
    let theme = document.documentElement.getAttribute("data-theme");
    let targetTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", targetTheme);
    localStorage.setItem("theme", targetTheme);
    updateThemeIcon(targetTheme);
});

function updateThemeIcon(theme) {
    themeToggle.innerHTML = theme === "light" ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
}

// 2. Navigation & Fetching Logic
buttons.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        searchInput.disabled = false;
        searchInput.value = '';
        fetchData(btn.dataset.category);
    });
});

favButton.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    favButton.classList.add("active");
    searchInput.disabled = true;
    renderLessons(savedFavorites, true);
});

// 3. Skeleton Loader
function showSkeletonLoader() {
    displayArea.innerHTML = Array(6).fill(`
        <div class="card">
            <div class="skeleton skel-title"></div>
            <div class="skeleton skel-btn"></div>
        </div>
    `).join('');
}

// 4. Fetch Data with Session Storage Caching
async function fetchData(categoryName) {
    showSkeletonLoader();

    // Check Cache first to save Firebase Reads
    const cachedData = sessionStorage.getItem(`lessons_${categoryName}`);
    if (cachedData) {
        currentLessons = JSON.parse(cachedData);
        renderLessons(currentLessons);
        return;
    }

    try {
        const q = query(collection(db, "lessons"), where("category", "==", categoryName));
        const querySnapshot = await getDocs(q);
        
        currentLessons = [];
        querySnapshot.forEach(doc => {
            currentLessons.push({ id: doc.id, ...doc.data() });
        });

        // Save to cache
        sessionStorage.setItem(`lessons_${categoryName}`, JSON.stringify(currentLessons));
        renderLessons(currentLessons);

    } catch (error) {
        displayArea.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle fa-3x" style="color:#ff4757;"></i><p>حدث خطأ في تحميل البيانات. يرجى المحاولة لاحقاً.</p></div>`;
        console.error(error);
        showToast("فشل الاتصال بقاعدة البيانات", "error");
    }
}

// 5. Render UI
function renderLessons(lessons, isFavoritesPage = false) {
    displayArea.innerHTML = "";

    if (lessons.length === 0) {
        displayArea.innerHTML = `<div class="empty-state"><i class="fas fa-folder-open fa-3x"></i><p>${isFavoritesPage ? "لا توجد دروس في المفضلة بعد" : "لا توجد دروس حالياً في هذا القسم"}</p></div>`;
        return;
    }

    lessons.forEach(data => {
        const isSaved = savedFavorites.some(fav => fav.id === data.id);
        
        const card = document.createElement("div");
        card.className = "card fade-in";
        card.innerHTML = `
            <h3>${data.title}</h3>
            <div class="card-actions">
                <a href="${data.link}" target="_blank" rel="noopener noreferrer" class="btn-link">
                    <i class="fas fa-file-pdf"></i> فتح الدرس
                </a>
                <button class="action-btn ${isSaved ? 'saved' : ''}" onclick="toggleFavorite('${data.id}', '${data.title}', '${data.link}', '${data.category || ''}')" title="حفظ في المفضلة">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="action-btn" onclick="shareLesson('${data.title}', '${data.link}')" title="مشاركة">
                    <i class="fas fa-share-alt"></i>
                </button>
            </div>
        `;
        displayArea.appendChild(card);
    });
}

// 6. Live Search
searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredLessons = currentLessons.filter(lesson => 
        lesson.title.toLowerCase().includes(searchTerm)
    );
    renderLessons(filteredLessons);
});

// 7. Global Functions (Favorites & Share & Toast)
window.toggleFavorite = (id, title, link, category) => {
    const index = savedFavorites.findIndex(fav => fav.id === id);
    if (index > -1) {
        savedFavorites.splice(index, 1);
        showToast("تم الإزالة من المفضلة");
    } else {
        savedFavorites.push({ id, title, link, category });
        showToast("تم الحفظ في المفضلة");
    }
    localStorage.setItem("favorites", JSON.stringify(savedFavorites));
    
    // Refresh view if on favorites page, else just update button
    if (favButton.classList.contains("active")) {
        renderLessons(savedFavorites, true);
    } else {
        renderLessons(currentLessons);
    }
};

window.shareLesson = async (title, link) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `منصة أستاذ ناجح نوري: ${title}`,
                text: `شاهد درس: ${title}`,
                url: link,
            });
            showToast("تمت المشاركة بنجاح");
        } catch (err) {
            console.log("تم إلغاء المشاركة");
        }
    } else {
        navigator.clipboard.writeText(link);
        showToast("تم نسخ الرابط للحافظة!");
    }
};

function showToast(message) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = "slideIn 0.3s backwards reverse";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 8. Scroll To Top
window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        scrollTopBtn.style.display = "block";
    } else {
        scrollTopBtn.style.display = "none";
    }
});

scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
});
