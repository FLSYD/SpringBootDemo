"use strict";

const PAGE_SIZES = new Set([5, 10, 20]);
const LEGACY_LIST_MESSAGE = "当前后端仍返回旧版列表，请运行已更新的分页后端";

const state = {
    mode: "create",
    saving: false,
    loadSequence: 0,
    noticeTimer: null,
    requestedPage: 1,
    pageSize: 5,
    currentPage: 0,
    totalPages: 0,
    total: null,
    appliedFilters: {
        teacherId: null,
        cname: "",
        active: false
    },
    loading: false,
    listReady: false
};

const elements = {
    tableBody: document.querySelector("#clazz-table-body"),
    resultCount: document.querySelector("#result-count"),
    notice: document.querySelector("#page-notice"),
    addButton: document.querySelector("#add-button"),
    refreshButton: document.querySelector("#refresh-button"),
    clearButton: document.querySelector("#clear-button"),
    searchForm: document.querySelector("#search-form"),
    searchTeacher: document.querySelector("#search-teacher"),
    searchCname: document.querySelector("#search-cname"),
    dialog: document.querySelector("#clazz-dialog"),
    dialogTitle: document.querySelector("#dialog-title"),
    dialogForm: document.querySelector("#clazz-form"),
    dialogCid: document.querySelector("#clazz-cid"),
    dialogCname: document.querySelector("#clazz-cname"),
    dialogTeacher: document.querySelector("#clazz-teacher"),
    dialogMessage: document.querySelector("#form-message"),
    closeButton: document.querySelector("#dialog-close-button"),
    cancelButton: document.querySelector("#dialog-cancel-button"),
    saveButton: document.querySelector("#dialog-save-button"),
    pageSize: document.querySelector("#page-size"),
    previousPage: document.querySelector("#previous-page"),
    nextPage: document.querySelector("#next-page"),
    pageNumbers: document.querySelector("#page-numbers"),
    pageStatus: document.querySelector("#page-status")
};

async function api(path, options = {}) {
    return Auth.request(path, options);
}

class LegacyListResponseError extends Error {}

function parsePageInfo(data) {
    if (Array.isArray(data)) {
        throw new LegacyListResponseError(LEGACY_LIST_MESSAGE);
    }
    if (!data || typeof data !== "object") {
        throw new Error("班级分页数据格式不正确");
    }

    const { records: list, total, current: pageNum, size: pageSize, pages } = data;
    if (!Array.isArray(list)) {
        throw new Error("班级分页数据缺少列表");
    }
    if (!Number.isInteger(total) || total < 0) {
        throw new Error("班级总数为无效的非负整数");
    }
    if (!Number.isInteger(pageNum) || pageNum < 1) {
        throw new Error("班级页码为无效的正整数");
    }
    if (!Number.isInteger(pageSize) || pageSize < 1) {
        throw new Error("每页条数为无效的正整数");
    }

    let effectivePages;
    if (pages === undefined || pages === null) {
        effectivePages = total === 0 ? 0 : Math.ceil(total / pageSize);
    } else if (!Number.isInteger(pages) || pages < 0) {
        throw new Error("班级总页数为无效的非负整数");
    } else {
        effectivePages = pages;
    }

    return {
        list,
        total,
        pageNum,
        pageSize,
        pages: effectivePages
    };
}

function currentFilters() {
    const teacherText = elements.searchTeacher.value.trim();
    const cname = elements.searchCname.value.trim();
    return {
        teacherId: teacherText === "" ? null : Number(teacherText),
        cname,
        active: teacherText !== "" || cname !== ""
    };
}

async function loadClasses(options = {}) {
    const page = options.page ?? state.requestedPage;
    const pageSize = options.pageSize ?? state.pageSize;
    const filters = options.filters ?? state.appliedFilters;
    const afterDelete = options.afterDelete === true;
    const fallbackUsed = options.fallbackUsed === true;
    const sequence = ++state.loadSequence;
    state.loading = true;
    state.listReady = false;
    state.requestedPage = page;
    state.pageSize = pageSize;
    renderLoading();

    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    if (filters.teacherId !== null) {
        params.set("teacherId", String(filters.teacherId));
    }
    if (filters.cname) {
        params.set("cname", filters.cname);
    }
    try {
        const data = await api(`clazz/list?${params.toString()}`);
        if (sequence !== state.loadSequence) {
            return;
        }
        const pageInfo = parsePageInfo(data);
        const correctedPage = pageInfo.pageNum < page;
        const needsLastPageRetry = pageInfo.total > 0
            && !correctedPage
            && (pageInfo.list.length === 0 || page > pageInfo.pages);

        if (afterDelete && !fallbackUsed && needsLastPageRetry) {
            await loadClasses({
                page: Math.max(1, pageInfo.pages),
                pageSize: pageInfo.pageSize,
                filters,
                afterDelete: true,
                fallbackUsed: true
            });
            return;
        }

        state.total = pageInfo.total;
        state.currentPage = pageInfo.total === 0 ? 0 : pageInfo.pageNum;
        state.totalPages = pageInfo.total === 0 ? 0 : pageInfo.pages;
        state.pageSize = pageInfo.pageSize;
        state.requestedPage = pageInfo.total === 0 ? 1 : pageInfo.pageNum;
        state.loading = false;
        state.listReady = true;
        syncPageSizeControl();
        renderPage(pageInfo, filters.active);
    } catch (error) {
        if (sequence !== state.loadSequence) {
            return;
        }
        const message = error instanceof Error ? error.message : "班级数据加载失败";
        renderLoadError(message, error instanceof LegacyListResponseError);
    }
}

function renderLoading() {
    elements.tableBody.replaceChildren(createMessageRow("正在加载班级数据…"));
    elements.resultCount.textContent = "正在加载班级数据…";
    elements.pageNumbers.replaceChildren();
    elements.pageStatus.textContent = "正在加载分页信息…";
    syncPaginationControls();
}

function renderLoadError(message, legacyList = false) {
    state.loading = false;
    state.listReady = false;
    state.currentPage = 0;
    state.totalPages = 0;
    state.total = null;
    const row = createMessageRow(message);
    const wrapper = row.firstElementChild;
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "button button-secondary";
    retryButton.textContent = "重新加载";
    retryButton.addEventListener("click", () => {
        loadClasses({
            page: state.requestedPage,
            pageSize: state.pageSize,
            filters: state.appliedFilters
        });
    });
    wrapper.append(retryButton);
    elements.tableBody.replaceChildren(row);
    elements.resultCount.textContent = "数据加载失败";
    elements.pageNumbers.replaceChildren();
    elements.pageStatus.textContent = "分页不可用";
    syncPaginationControls();
    showNotice(
        legacyList ? LEGACY_LIST_MESSAGE : "班级数据加载失败，请检查服务与数据库连接。",
        "error"
    );
}

function createMessageRow(message) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    const wrapper = document.createElement("div");
    const paragraph = document.createElement("p");

    cell.className = "table-message";
    cell.colSpan = 4;
    wrapper.className = "empty-state";
    paragraph.textContent = message;
    wrapper.append(paragraph);
    cell.append(wrapper);
    row.append(cell);
    return row;
}

function renderPage(pageInfo, searchActive) {
    elements.tableBody.replaceChildren();
    elements.resultCount.textContent = `共 ${pageInfo.total} 个班级`;
    renderPagination();

    if (pageInfo.list.length === 0) {
        const message = searchActive ? "没有找到匹配的班级" : "暂无班级数据";
        const row = createMessageRow(message);
        const wrapper = row.firstElementChild;
        const reloadButton = document.createElement("button");
        reloadButton.type = "button";
        reloadButton.className = "button button-secondary";
        reloadButton.textContent = searchActive ? "清空并查看全部" : "刷新";
        reloadButton.addEventListener("click", searchActive ? clearSearch : loadClasses);
        wrapper.append(reloadButton);
        elements.tableBody.append(row);
        return;
    }

    const fragment = document.createDocumentFragment();
    for (const clazz of pageInfo.list) {
        fragment.append(createClassRow(clazz));
    }
    elements.tableBody.append(fragment);
}

function renderPagination() {
    elements.pageNumbers.replaceChildren();
    elements.pageStatus.textContent = `第 ${state.currentPage}/${state.totalPages} 页`;

    if (state.totalPages > 0) {
        const start = Math.max(1, Math.min(state.currentPage - 2, state.totalPages - 4));
        const end = Math.min(state.totalPages, start + 4);
        const fragment = document.createDocumentFragment();

        for (let page = start; page <= end; page += 1) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "pagination-button";
            button.textContent = String(page);
            button.setAttribute("aria-label", `第 ${page} 页`);
            if (page === state.currentPage) {
                button.setAttribute("aria-current", "page");
            }
            button.addEventListener("click", () => goToPage(page));
            fragment.append(button);
        }
        elements.pageNumbers.append(fragment);
    }
    syncPaginationControls();
}

function syncPaginationControls() {
    const canNavigate = state.listReady && !state.loading && state.totalPages > 0;
    elements.previousPage.disabled = !canNavigate || state.currentPage <= 1;
    elements.nextPage.disabled = !canNavigate || state.currentPage >= state.totalPages;
    elements.pageSize.disabled = state.loading;

    for (const button of elements.pageNumbers.querySelectorAll("button")) {
        button.disabled = !canNavigate || button.textContent === String(state.currentPage);
    }
}

function syncPageSizeControl() {
    if (PAGE_SIZES.has(state.pageSize)) {
        elements.pageSize.value = String(state.pageSize);
    }
}

function goToPage(page) {
    if (
        state.loading
        || !state.listReady
        || !Number.isInteger(page)
        || page < 1
        || page > state.totalPages
        || page === state.currentPage
    ) {
        return;
    }
    loadClasses({
        page,
        pageSize: state.pageSize,
        filters: state.appliedFilters
    });
}

function createClassRow(clazz) {
    const row = document.createElement("tr");
    row.append(
        createTextCell(clazz.cid ?? "—"),
        createTextCell(clazz.cname ?? ""),
        createTextCell(clazz.teacherId ?? "未设置")
    );

    const actionCell = document.createElement("td");
    const actionGroup = document.createElement("div");
    const detailButton = createActionButton("详情", "detail");
    const editButton = createActionButton("编辑", "edit");
    const deleteButton = createActionButton("删除", "delete danger");

    actionGroup.className = "action-group";
    detailButton.addEventListener("click", () => openClassDetails(clazz));
    editButton.addEventListener("click", () => openEditor(clazz));
    deleteButton.addEventListener("click", () => deleteClass(clazz, deleteButton));
    actionGroup.append(detailButton, editButton, deleteButton);
    actionCell.append(actionGroup);
    row.append(actionCell);
    return row;
}

function createTextCell(value) {
    const cell = document.createElement("td");
    cell.textContent = String(value);
    return cell;
}

function createActionButton(label, className) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `text-button ${className}`;
    button.textContent = label;
    return button;
}

function openCreator() {
    state.mode = "create";
    elements.dialogTitle.textContent = "新增班级";
    elements.dialogForm.reset();
    elements.dialogCid.value = "自动生成";
    hideFormMessage();
    openDialog();
}

function openEditor(clazz) {
    state.mode = "edit";
    elements.dialogTitle.textContent = "编辑班级";
    elements.dialogForm.reset();
    elements.dialogCid.value = String(clazz.cid ?? "");
    elements.dialogCname.value = clazz.cname ?? "";
    elements.dialogTeacher.value = clazz.teacherId == null ? "" : String(clazz.teacherId);
    hideFormMessage();
    openDialog();
}

function openDialog() {
    if (typeof elements.dialog.showModal === "function") {
        elements.dialog.showModal();
    } else {
        elements.dialog.setAttribute("open", "");
    }
    window.requestAnimationFrame(() => elements.dialogCname.focus());
}

function closeDialog() {
    if (elements.dialog.open && typeof elements.dialog.close === "function") {
        elements.dialog.close();
    } else {
        elements.dialog.removeAttribute("open");
    }
}

function showFormMessage(message) {
    elements.dialogMessage.textContent = message;
    elements.dialogMessage.hidden = false;
}

function hideFormMessage() {
    elements.dialogMessage.textContent = "";
    elements.dialogMessage.hidden = true;
}

function validateDialogInput() {
    const cname = elements.dialogCname.value.trim();
    const teacherText = elements.dialogTeacher.value.trim();

    if (!cname) {
        showFormMessage("请输入班级名称。");
        elements.dialogCname.focus();
        return null;
    }
    if (Array.from(cname).length > 20) {
        showFormMessage("班级名称不能超过 20 个字符。");
        elements.dialogCname.focus();
        return null;
    }
    if (teacherText !== "" && (!/^\d+$/.test(teacherText) || Number(teacherText) < 1)) {
        showFormMessage("教师编号必须是正整数，也可以留空。");
        elements.dialogTeacher.focus();
        return null;
    }

    return {
        cname,
        teacherId: teacherText === "" ? null : Number(teacherText)
    };
}

async function saveDialog(event) {
    event.preventDefault();
    if (state.saving) {
        return;
    }

    hideFormMessage();
    const input = validateDialogInput();
    if (!input) {
        return;
    }

    const isCreate = state.mode === "create";
    const reloadPage = isCreate ? 1 : Math.max(1, state.requestedPage);
    const payload = { ...input };
    let path = "clazz/add";
    let method = "POST";
    let successMessage = `已新增班级“${input.cname}”`;

    if (state.mode === "edit") {
        const cid = Number(elements.dialogCid.value);
        if (!Number.isInteger(cid) || cid < 1) {
            showFormMessage("班级编号无效，请刷新后重试。");
            return;
        }
        payload.cid = cid;
        path = "clazz/update";
        method = "PUT";
        successMessage = `已更新班级“${input.cname}”`;
    }

    setSaving(true);
    try {
        await api(path, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        closeDialog();
        showNotice(successMessage);
        await loadClasses({
            page: reloadPage,
            pageSize: state.pageSize,
            filters: state.appliedFilters
        });
    } catch (error) {
        showFormMessage(error instanceof Error ? error.message : "保存失败，请稍后重试。");
    } finally {
        setSaving(false);
    }
}

function setSaving(saving) {
    state.saving = saving;
    elements.saveButton.disabled = saving;
    elements.cancelButton.disabled = saving;
    elements.closeButton.disabled = saving;
    elements.saveButton.textContent = saving ? "保存中…" : "保存";
}

async function deleteClass(clazz, button) {
    const cid = Number(clazz.cid);
    if (!Number.isInteger(cid) || cid < 1) {
        showNotice("班级编号无效，请刷新后重试。", "error");
        return;
    }

    const confirmed = window.confirm(`确定删除班级“${clazz.cname}”吗？删除后无法恢复。`);
    if (!confirmed) {
        return;
    }

    button.disabled = true;
    try {
        await api(`clazz/delete?cid=${encodeURIComponent(cid)}`, { method: "DELETE" });
        showNotice(`已删除班级“${clazz.cname}”`);
        await loadClasses({
            page: Math.max(1, state.requestedPage),
            pageSize: state.pageSize,
            filters: state.appliedFilters,
            afterDelete: true
        });
    } catch (error) {
        showNotice(
            error instanceof Error ? error.message : "删除失败，请稍后重试。",
            "error"
        );
        button.disabled = false;
    }
}

function submitSearch(event) {
    event.preventDefault();
    const teacherText = elements.searchTeacher.value.trim();
    if (teacherText !== "" && (!/^\d+$/.test(teacherText) || Number(teacherText) < 1)) {
        showNotice("查询用的教师编号必须是正整数。", "error");
        elements.searchTeacher.focus();
        return;
    }
    state.appliedFilters = currentFilters();
    loadClasses({
        page: 1,
        pageSize: state.pageSize,
        filters: state.appliedFilters
    });
}

function clearSearch() {
    elements.searchForm.reset();
    state.appliedFilters = {
        teacherId: null,
        cname: "",
        active: false
    };
    loadClasses({
        page: 1,
        pageSize: state.pageSize,
        filters: state.appliedFilters
    });
}

function showNotice(message, type = "success") {
    window.clearTimeout(state.noticeTimer);
    elements.notice.textContent = message;
    elements.notice.classList.toggle("is-error", type === "error");
    elements.notice.hidden = false;
    state.noticeTimer = window.setTimeout(() => {
        elements.notice.hidden = true;
    }, type === "error" ? 6000 : 3500);
}

elements.addButton.addEventListener("click", openCreator);
elements.refreshButton.addEventListener("click", () => {
    elements.notice.hidden = true;
    loadClasses({
        page: state.currentPage > 0 ? state.currentPage : state.requestedPage,
        pageSize: state.pageSize,
        filters: state.appliedFilters
    });
});
elements.previousPage.addEventListener("click", () => goToPage(state.currentPage - 1));
elements.nextPage.addEventListener("click", () => goToPage(state.currentPage + 1));
elements.pageSize.addEventListener("change", () => {
    const pageSize = Number(elements.pageSize.value);
    if (!PAGE_SIZES.has(pageSize)) {
        elements.pageSize.value = String(state.pageSize);
        return;
    }
    loadClasses({
        page: 1,
        pageSize,
        filters: state.appliedFilters
    });
});
elements.clearButton.addEventListener("click", clearSearch);
elements.searchForm.addEventListener("submit", submitSearch);
elements.dialogForm.addEventListener("submit", saveDialog);
elements.closeButton.addEventListener("click", closeDialog);
elements.cancelButton.addEventListener("click", closeDialog);
elements.dialog.addEventListener("cancel", (event) => {
    if (state.saving) {
        event.preventDefault();
    }
});
elements.dialog.addEventListener("click", (event) => {
    if (event.target === elements.dialog && !state.saving) {
        closeDialog();
    }
});

let detailClass = null;
let detailSequence = 0;

async function openClassDetails(clazz) {
    const sequence = ++detailSequence;
    detailClass = clazz;
    const dialog = document.querySelector("#class-detail-dialog");
    const message = document.querySelector("#class-detail-message");
    const info = document.querySelector("#class-detail-info");
    const students = document.querySelector("#detail-students");
    const retry = document.querySelector("#class-detail-retry");
    message.textContent = "正在加载班级信息…";
    info.hidden = true;
    retry.hidden = true;
    students.replaceChildren();
    if (!dialog.open) {
        dialog.showModal();
    }
    try {
        const cid = encodeURIComponent(clazz.cid);
        const [details, roster] = await Promise.all([
            api(`clazz/getById?cid=${cid}`),
            api(`clazz/getByIdWithStudents?cid=${cid}`)
        ]);
        if (sequence !== detailSequence || !dialog.open) {
            return;
        }
        if (!details) {
            throw new Error("班级不存在，请刷新列表。");
        }
        const list = roster?.students ?? [];
        document.querySelector("#detail-cid").textContent = details.cid;
        document.querySelector("#detail-cname").textContent = details.cname;
        document.querySelector("#detail-teacher").textContent = details.teacherId ?? "未设置";
        document.querySelector("#detail-count").textContent = String(list.length);
        info.hidden = false;
        message.textContent = list.length ? "班级学生" : "该班级暂无学生。";
        for (const student of list) {
            const row = document.createElement("tr");
            row.append(createTextCell(student.sid), createTextCell(student.sname), createTextCell(student.classId));
            students.append(row);
        }
    } catch (error) {
        if (sequence === detailSequence && dialog.open) {
            message.textContent = error.message;
            retry.hidden = false;
        }
    }
}

document.querySelector("#class-detail-close").addEventListener("click", () => {
    document.querySelector("#class-detail-dialog").close();
});
document.querySelector("#class-detail-retry").addEventListener("click", () => openClassDetails(detailClass));

// 页面先验证当前用户，验证成功后才展示班级数据。
async function initializeWorkspace() {
    const workspace = document.querySelector("#workspace");
    const screen = document.querySelector("#session-screen");
    const actions = document.querySelector("#session-actions");
    const spinner = document.querySelector("#session-spinner");
    workspace.hidden = true;
    screen.hidden = false;
    actions.hidden = true;
    spinner.hidden = false;
    document.querySelector("#session-message").textContent = "正在验证登录状态…";
    try {
        const user = await api("user/me");
        document.querySelector("#account-name").textContent = user.name || user.username;
        document.querySelector("#account-avatar").textContent = Array.from(user.name || user.username || "我")[0];
        for (const field of ["id", "username", "name", "age"]) {
            document.querySelector(`#profile-${field}`).textContent = user[field] ?? "未填写";
        }
        screen.hidden = true;
        workspace.hidden = false;
        await loadClasses();
    } catch (error) {
        document.querySelector("#session-message").textContent = error.message;
        spinner.hidden = true;
        actions.hidden = false;
    }
}

document.querySelector("#session-retry").addEventListener("click", initializeWorkspace);
document.querySelector("#session-login").addEventListener("click", () => Auth.clearToken());
document.querySelector("#profile-button").addEventListener("click", () => {
    document.querySelector("#profile-dialog").showModal();
});
document.querySelector("#profile-close").addEventListener("click", () => {
    document.querySelector("#profile-dialog").close();
});
document.querySelector("#logout-button").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    button.textContent = "退出中…";
    try {
        await api("user/logout", { method: "POST" });
        Auth.clearToken();
        Auth.toLogin("logout");
    } catch (error) {
        showNotice(error.message, "error");
    } finally {
        button.disabled = false;
        button.textContent = "退出登录";
    }
});
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        initializeWorkspace();
    }
});

initializeWorkspace();
