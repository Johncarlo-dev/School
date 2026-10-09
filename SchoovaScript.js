"use strict";

// SchoovaMate front-end demo. Demo credentials are not secure authentication.
const DEMO_USERS = [
  { id: "123456789012", password: "Student123!", name: "Demo Student", role: "student" },
  { id: "123456789013", password: "Teacher123!", name: "Demo Teacher", role: "teacher" }
];

const $ = (selector) => document.querySelector(selector);
const authPage = $("#authPage");
const dashboardPage = $("#dashboardPage");
const loginForm = $("#loginForm");
const loginIdentifier = $("#loginIdentifier");
const loginPassword = $("#loginPassword");
const loginError = $("#loginError");
const studentRoleBtn = $("#studentRoleBtn");
const teacherRoleBtn = $("#teacherRoleBtn");
const passwordToggle = $("#passwordToggle");
const rememberLogin = $("#rememberLogin");
let selectedRole = "student";
let currentUser = null;
let editingTaskId = null;
let toastTimer = null;

const TASKS_KEY = "schoovamate_demo_tasks_v1";
const ANNOUNCEMENTS_KEY = "schoovamate_demo_announcements_v1";
const SESSION_KEY = "schoovamate_demo_session_v1";
const REMEMBER_KEY = "schoovamate_demo_remember_v1";

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch (error) {
    console.warn("Could not read saved data:", error);
    return fallback;
  }
}
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    showToast("Could not save. Browser storage may be unavailable.");
    return false;
  }
}
function getTasks() {
  const value = readStorage(TASKS_KEY, []);
  return Array.isArray(value) ? value : [];
}
function saveTasks(tasks) { return writeStorage(TASKS_KEY, tasks); }
function getAnnouncements() {
  const value = readStorage(ANNOUNCEMENTS_KEY, []);
  return Array.isArray(value) ? value : [];
}
function saveAnnouncements(items) { return writeStorage(ANNOUNCEMENTS_KEY, items); }

function showToast(message) {
  const toast = $("#toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function selectRole(role) {
  selectedRole = role;
  studentRoleBtn.classList.toggle("active", role === "student");
  teacherRoleBtn.classList.toggle("active", role === "teacher");
  $("#identifierLabel").textContent = role === "student" ? "Student LRN" : "Teacher ID";
  loginIdentifier.placeholder = role === "student" ? "Enter your demo LRN" : "Enter your demo teacher ID";
  loginIdentifier.value = "";
  loginPassword.value = "";
  loginError.textContent = "";
}
studentRoleBtn.addEventListener("click", () => selectRole("student"));
teacherRoleBtn.addEventListener("click", () => selectRole("teacher"));

// Fixed: HTML and JavaScript both use id="passwordToggle".
passwordToggle.addEventListener("click", () => {
  const show = loginPassword.type === "password";
  loginPassword.type = show ? "text" : "password";
  passwordToggle.textContent = show ? "🙈" : "👁";
  passwordToggle.setAttribute("aria-label", show ? "Hide password" : "Show password");
});

$("#fillDemoBtn").addEventListener("click", () => {
  const account = DEMO_USERS.find((user) => user.role === selectedRole);
  loginIdentifier.value = account.id;
  loginPassword.value = account.password;
  loginError.textContent = "";
  showToast("Demo account filled in.");
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const identifier = loginIdentifier.value.trim();
  const password = loginPassword.value;
  const user = DEMO_USERS.find((account) =>
    account.id === identifier && account.password === password && account.role === selectedRole
  );
  if (!user) {
    loginError.textContent = "Incorrect ID or password for the selected account type.";
    return;
  }
  loginError.textContent = "";
  currentUser = { id: user.id, name: user.name, role: user.role };
  try {
    if (rememberLogin.checked) localStorage.setItem(REMEMBER_KEY, user.id);
    else localStorage.removeItem(REMEMBER_KEY);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
  } catch (error) {
    console.warn("Session storage is unavailable:", error);
  }
  openDashboard();
});

function openDashboard() {
  if (!currentUser) return;
  authPage.classList.add("hidden");
  dashboardPage.classList.remove("hidden");
  const roleLabel = currentUser.role === "teacher" ? "Teacher" : "Student";
  $("#sidebarUserName").textContent = currentUser.name;
  $("#sidebarUserRole").textContent = roleLabel;
  $("#headerUserName").textContent = currentUser.name;
  $("#headerUserRole").textContent = roleLabel + " account";
  $("#userAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("#headerAvatar").textContent = currentUser.name.charAt(0).toUpperCase();
  $("#welcomeHeading").textContent = "Welcome back, " + roleLabel + "!";
  $("#currentDate").textContent = new Date().toLocaleDateString(undefined, {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  $("#addAnnouncementBtn").classList.toggle("hidden", currentUser.role !== "teacher");
  renderAll();
  showView("overview");
}

$("#logoutBtn").addEventListener("click", () => {
  currentUser = null;
  try { sessionStorage.removeItem(SESSION_KEY); } catch (error) {}
  dashboardPage.classList.add("hidden");
  authPage.classList.remove("hidden");
  loginPassword.value = "";
  loginError.textContent = "";
  showToast("You have logged out.");
});

function showView(viewName) {
  const views = {
    overview: $("#overviewView"),
    tasks: $("#tasksView"),
    announcements: $("#announcementsView")
  };
  if (!views[viewName]) return;
  Object.values(views).forEach((view) => view.classList.add("hidden"));
  views[viewName].classList.remove("hidden");
  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  const titles = { overview: "Overview", tasks: "My Tasks", announcements: "Announcements" };
  $("#headerPageTitle").textContent = titles[viewName];
  renderAll();
}
document.querySelectorAll(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.view));
});
document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.go));
});

const taskForm = $("#taskForm");
$("#addTaskBtn").addEventListener("click", () => {
  editingTaskId = null;
  taskForm.reset();
  $("#taskFormHeading").textContent = "Add a new task";
  taskForm.classList.remove("hidden");
  $("#taskDueDate").value = new Date().toISOString().slice(0, 10);
  $("#taskTitle").focus();
});
$("#cancelTaskBtn").addEventListener("click", () => {
  taskForm.reset();
  editingTaskId = null;
  taskForm.classList.add("hidden");
});
taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentUser) return;
  const title = $("#taskTitle").value.trim();
  const subject = $("#taskSubject").value.trim();
  const dueDate = $("#taskDueDate").value;
  const priority = $("#taskPriority").value;
  if (!title || !subject || !dueDate) {
    showToast("Please complete all task fields.");
    return;
  }
  const tasks = getTasks();
  if (editingTaskId !== null) {
    const index = tasks.findIndex((task) => task.id === editingTaskId && task.ownerId === currentUser.id);
    if (index === -1) { showToast("Task not found."); return; }
    tasks[index] = { ...tasks[index], title, subject, dueDate, priority };
  } else {
    tasks.unshift({
      id: createId(), title, subject, dueDate, priority,
      completed: false, ownerId: currentUser.id, createdAt: new Date().toISOString()
    });
  }
  if (!saveTasks(tasks)) return;
  taskForm.reset();
  taskForm.classList.add("hidden");
  editingTaskId = null;
  renderAll();
  showToast("Task saved successfully.");
});

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
  return String(Date.now()) + "-" + Math.random().toString(36).slice(2);
}
function getVisibleTasks() {
  if (!currentUser) return [];
  return getTasks().filter((task) => task.ownerId === currentUser.id);
}
function editTask(taskId) {
  const task = getVisibleTasks().find((item) => item.id === taskId);
  if (!task) { showToast("Task not found."); return; }
  editingTaskId = taskId;
  $("#taskTitle").value = task.title;
  $("#taskSubject").value = task.subject;
  $("#taskDueDate").value = task.dueDate;
  $("#taskPriority").value = task.priority;
  $("#taskFormHeading").textContent = "Edit task";
  taskForm.classList.remove("hidden");
  showView("tasks");
  taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
}
function toggleTask(taskId, completed) {
  const tasks = getTasks();
  const task = tasks.find((item) => item.id === taskId && currentUser && item.ownerId === currentUser.id);
  if (!task) return;
  task.completed = completed;
  if (!saveTasks(tasks)) return;
  renderAll();
  showToast(completed ? "Task completed!" : "Task marked pending.");
}
function deleteTask(taskId) {
  const tasks = getTasks();
  const task = tasks.find((item) => item.id === taskId && currentUser && item.ownerId === currentUser.id);
  if (!task) return;
  if (!window.confirm("Delete this task?")) return;
  if (!saveTasks(tasks.filter((item) => !(item.id === taskId && item.ownerId === currentUser.id)))) return;
  renderAll();
  showToast("Task deleted.");
}
function createTaskCard(task) {
  const card = document.createElement("article");
  card.className = "task-card" + (task.completed ? " completed" : "");
  const check = document.createElement("input");
  check.type = "checkbox"; check.className = "task-check"; check.checked = Boolean(task.completed);
  check.setAttribute("aria-label", "Toggle task completion: " + task.title);
  check.addEventListener("change", () => toggleTask(task.id, check.checked));
  const details = document.createElement("div"); details.className = "task-details";
  const title = document.createElement("div"); title.className = "task-title"; title.textContent = task.title;
  const meta = document.createElement("div"); meta.className = "task-meta";
  const subject = document.createElement("span"); subject.textContent = task.subject;
  const due = document.createElement("span"); due.textContent = "Due: " + formatDate(task.dueDate);
  const safePriority = ["High", "Normal", "Low"].includes(task.priority) ? task.priority : "Normal";
  const priority = document.createElement("span"); priority.className = "priority priority-" + safePriority.toLowerCase(); priority.textContent = safePriority + " priority";
  meta.append(subject, due, priority); details.append(title, meta);
  const actions = document.createElement("div"); actions.className = "task-actions";
  const editButton = document.createElement("button"); editButton.type = "button"; editButton.className = "small-action"; editButton.textContent = "Edit"; editButton.addEventListener("click", () => editTask(task.id));
  const deleteButton = document.createElement("button"); deleteButton.type = "button"; deleteButton.className = "small-action delete-action"; deleteButton.textContent = "Delete"; deleteButton.addEventListener("click", () => deleteTask(task.id));
  actions.append(editButton, deleteButton); card.append(check, details, actions);
  return card;
}

$("#taskSearch").addEventListener("input", renderTasks);
$("#taskFilter").addEventListener("change", renderTasks);
function renderTasks() {
  const allTasks = getVisibleTasks();
  const query = $("#taskSearch").value.trim().toLowerCase();
  const filter = $("#taskFilter").value;
  const filtered = allTasks.filter((task) => {
    const matchesQuery = task.title.toLowerCase().includes(query) || task.subject.toLowerCase().includes(query);
    const matchesFilter = filter === "all" || (filter === "pending" && !task.completed) || (filter === "completed" && task.completed);
    return matchesQuery && matchesFilter;
  });
  const container = $("#allTasks");
  container.replaceChildren();
  if (filtered.length === 0) {
    container.append(makeEmptyState("No tasks found", query ? "Try another search." : "Add a task to get started."));
    return;
  }
  filtered.forEach((task) => container.append(createTaskCard(task)));
}
function renderRecentTasks() {
  const container = $("#recentTasks"); container.replaceChildren();
  const tasks = getVisibleTasks().slice().sort((a, b) => {
    if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
    return String(a.dueDate).localeCompare(String(b.dueDate));
  }).slice(0, 4);
  if (tasks.length === 0) {
    container.append(makeEmptyState("No tasks yet", "Your added tasks will appear here."));
    return;
  }
  tasks.forEach((task) => container.append(createTaskCard(task)));
}

const announcementForm = $("#announcementForm");
$("#addAnnouncementBtn").addEventListener("click", () => {
  if (!currentUser || currentUser.role !== "teacher") {
    showToast("Only the demo teacher can post announcements."); return;
  }
  announcementForm.reset();
  announcementForm.classList.remove("hidden");
  $("#announcementTitle").focus();
});
$("#cancelAnnouncementBtn").addEventListener("click", () => {
  announcementForm.reset(); announcementForm.classList.add("hidden");
});
announcementForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!currentUser || currentUser.role !== "teacher") return;
  const title = $("#announcementTitle").value.trim();
  const message = $("#announcementMessage").value.trim();
  if (!title || !message) { showToast("Enter both a title and a message."); return; }
  const announcements = getAnnouncements();
  announcements.unshift({ id: createId(), title, message, author: currentUser.name, createdAt: new Date().toISOString() });
  if (!saveAnnouncements(announcements)) return;
  announcementForm.reset(); announcementForm.classList.add("hidden");
  renderAll(); showToast("Announcement published.");
});
function createAnnouncementCard(announcement) {
  const card = document.createElement("article"); card.className = "announcement-card";
  const top = document.createElement("div"); top.className = "announcement-top";
  const title = document.createElement("h3"); title.textContent = announcement.title;
  const date = document.createElement("span"); date.className = "announcement-date";
  date.textContent = formatDate(announcement.createdAt ? announcement.createdAt.slice(0, 10) : "");
  top.append(title, date);
  const message = document.createElement("p"); message.textContent = announcement.message;
  const author = document.createElement("div"); author.className = "announcement-author"; author.textContent = "Posted by " + announcement.author;
  card.append(top, message, author); return card;
}
function renderAnnouncements() {
  const announcements = getAnnouncements();
  const allContainer = $("#allAnnouncements");
  const recentContainer = $("#recentAnnouncements");
  allContainer.replaceChildren(); recentContainer.replaceChildren();
  if (announcements.length === 0) {
    allContainer.append(makeEmptyState("No announcements yet", "School updates will appear here."));
    recentContainer.append(makeEmptyState("Nothing to show yet", "Check back for updates."));
    return;
  }
  announcements.forEach((item) => allContainer.append(createAnnouncementCard(item)));
  announcements.slice(0, 3).forEach((item) => recentContainer.append(createAnnouncementCard(item)));
}
function formatDate(dateString) {
  if (!dateString) return "No date";
  const date = new Date(dateString + "T00:00:00");
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function makeEmptyState(titleText, messageText) {
  const box = document.createElement("div"); box.className = "empty-state";
  const title = document.createElement("strong"); title.textContent = titleText;
  const message = document.createElement("p"); message.textContent = messageText;
  box.append(title, message); return box;
}
function renderCounters() {
  const tasks = getVisibleTasks();
  const completed = tasks.filter((task) => task.completed).length;
  $("#totalTasks").textContent = tasks.length;
  $("#pendingTasks").textContent = tasks.length - completed;
  $("#completedTasks").textContent = completed;
  $("#taskNavCount").textContent = tasks.length - completed;
}
function renderAll() { renderCounters(); renderTasks(); renderRecentTasks(); renderAnnouncements(); }

function restoreLogin() {
  try {
    const rememberedId = localStorage.getItem(REMEMBER_KEY);
    if (rememberedId) {
      loginIdentifier.value = rememberedId;
      rememberLogin.checked = true;
    }
    const sessionText = sessionStorage.getItem(SESSION_KEY);
    if (sessionText) {
      const session = JSON.parse(sessionText);
      const validUser = DEMO_USERS.find((user) => user.id === session.id && user.role === session.role);
      if (validUser) {
        currentUser = { id: validUser.id, name: validUser.name, role: validUser.role };
        selectRole(validUser.role);
        openDashboard();
      }
    }
  } catch (error) {
    console.warn("Could not restore demo session:", error);
  }
}
restoreLogin();
