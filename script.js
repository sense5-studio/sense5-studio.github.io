let projectsData = [];
let sortedProjects = [];

async function loadProjects() {
    const grid = document.getElementById('projectsGrid');
    
    showSkeletons(grid);
    
    try {
        const response = await fetch('projects.json');
        if (!response.ok) {
            throw new Error('Не вдалося завантажити projects.json');
        }
        projectsData = await response.json();
        
        renderProjects();
    } catch (error) {
        console.error('Помилка завантаження проєктів:', error);
        grid.innerHTML = '<p class="empty-state">Не вдалося завантажити проєкти.</p>';
    }
}

function showSkeletons(container) {
    const skeletonCount = 3;
    const skeletons = Array(skeletonCount).fill(0).map(() => `
        <div class="skeleton-card">
            <div class="skeleton-image"></div>
            <div class="skeleton-title"></div>
            <div class="skeleton-meta"></div>
            <div class="skeleton-progress"></div>
            <div>
                <span class="skeleton-badge"></span>
                <span class="skeleton-badge"></span>
            </div>
        </div>
    `).join('');
    container.innerHTML = skeletons;
}

function renderProjects() {
    const grid = document.getElementById('projectsGrid');
    
    sortedProjects = sortProjects(projectsData);
    
    if (sortedProjects.length === 0) {
        grid.innerHTML = '<p class="empty-state">Проєктів не знайдено.</p>';
        return;
    }
    
    grid.innerHTML = sortedProjects.map((project, index) => createProjectCard(project, index)).join('');
    
    const soonCard = createSoonCard();
    grid.innerHTML += soonCard;
    
    attachProjectCardHandlers();
    
    setTimeout(() => {
        animateProgressBars();
    }, 100);
}

function createSoonCard() {
    return `
        <article class="project-card project-card-soon" role="listitem">
            <div class="project-content">
                <div class="project-header">
                    <h3 class="project-title">Скоро</h3>
                </div>
                <p class="project-summary">
                    Незабаром тут з'являться нові проєкти локалізації. Якщо у вас є пропозиція щодо гри, яку варто локалізувати — напишіть нам.
                </p>
                <div class="project-links">
                    <a href="mailto:sense5.studio.engineer@gmail.com?subject=Пропозиція локалізації" class="project-link project-link-suggest">
                        Запропонувати
                    </a>
                </div>
            </div>
        </article>
    `;
}

function sortProjects(projects) {
    return [...projects].sort((a, b) => {
        if (a.status !== b.status) {
            if (a.status === 'in_progress') return -1;
            if (b.status === 'in_progress') return 1;
        }
        const yearA = a.year || 0;
        const yearB = b.year || 0;
        return yearB - yearA;
    });
}

function createProjectCard(project, index) {
    const progress = getProgress(project);
    const statusClass = project.status === 'completed' ? 'completed' : 'in_progress';
    const statusText = project.status === 'completed' ? 'Завершено' : 'У процесі';
    const currentYear = new Date().getFullYear();
    const isNew = project.year === currentYear;
    const featuredClass = project.featured ? 'featured' : '';
    
    const imageHtml = project.image 
        ? `<div class="project-image-container">
            <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" class="project-image" loading="lazy">
          </div>`
        : '';
    
    const metaItems = [];
    if (project.year) {
        metaItems.push(`<span class="project-meta-item">${project.year}</span>`);
    }
    if (project.platform) {
        metaItems.push(`<span class="project-meta-item">${project.platform}</span>`);
    }
    
    const scopeBadges = project.scope && project.scope.length > 0
        ? project.scope.map(scope => 
            `<span class="scope-badge">${escapeHtml(scope)}</span>`
          ).join('')
        : '';
    
    const links = [];
    if (project.links) {
        if (project.links.store) {
            links.push(
                `<a href="${escapeHtml(project.links.store)}" target="_blank" rel="noopener noreferrer" class="project-link">
                    Сторінка гри
                </a>`
            );
        }
        if (project.links.repo) {
            links.push(
                `<a href="${escapeHtml(project.links.repo)}" target="_blank" rel="noopener noreferrer" class="project-link">
                    Repo
                </a>`
            );
        }
        if (project.links.devlog) {
            links.push(
                `<a href="${escapeHtml(project.links.devlog)}" target="_blank" rel="noopener noreferrer" class="project-link">
                    Devlog
                </a>`
            );
        }
    }
    
    const linksHtml = links.length > 0 
        ? `<div class="project-links">${links.join('')}</div>`
        : '';
    
    const downloadButton = project.downloadUrl 
        ? `<button class="btn btn-primary btn-card-download" data-project-index="${index}">
            <span>Скачати</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
        </button>`
        : '';
    
    const newBadge = isNew ? '<span class="project-new-badge">NEW</span>' : '';
    
    return `
        <article class="project-card ${featuredClass}" role="listitem" data-project-index="${index}" style="cursor: pointer;">
            ${newBadge}
            ${imageHtml}
            <div class="project-content">
                <div class="project-header">
                    <h3 class="project-title">${escapeHtml(project.title)}</h3>
                </div>
                <div class="project-meta">
                    ${metaItems.join('')}
                    <span class="project-status">
                        <span class="status-indicator ${statusClass}"></span>
                        ${statusText}
                    </span>
                </div>
                <div class="progress-container">
                    <div class="progress-label">
                        <span>Прогрес</span>
                        <span>${progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" data-progress="${progress}" style="width: 0%"></div>
                    </div>
                </div>
                ${scopeBadges ? `<div class="project-scope">${scopeBadges}</div>` : ''}
                ${project.summary ? `<p class="project-summary">${escapeHtml(project.summary)}</p>` : ''}
                ${downloadButton ? `<div class="project-card-download">${downloadButton}</div>` : ''}
                ${linksHtml}
            </div>
        </article>
    `;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getProgress(project) {
    if (project.progress !== undefined) {
        return Math.max(0, Math.min(100, project.progress));
    }
    return project.status === 'completed' ? 100 : 0;
}

function animateProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progress = parseInt(entry.target.getAttribute('data-progress') || '0');
                entry.target.style.width = `${progress}%`;
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });
    
    progressBars.forEach(bar => {
        observer.observe(bar);
    });
}

function attachProjectCardHandlers() {
    document.querySelectorAll('.project-card[data-project-index]').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a') || e.target.closest('button')) {
                return;
            }
            
            const projectIndex = parseInt(card.getAttribute('data-project-index'));
            const project = sortedProjects[projectIndex];
            
            if (project) {
                openProjectModal(project);
            }
        });
    });
    
    document.querySelectorAll('.btn-card-download').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectIndex = parseInt(btn.getAttribute('data-project-index'));
            const project = sortedProjects[projectIndex];
            
            if (project) {
                openProjectModal(project);
            }
        });
    });
}

function openProjectModal(project) {
    const modal = document.getElementById('projectModal');
    const modalContent = document.getElementById('modalContent');
    
    let dateText = '';
    if (project.releaseDate) {
        const date = new Date(project.releaseDate);
        dateText = date.toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    
    const instructionsHtml = project.instructions 
        ? project.instructions.split('\n').map(line => `<p>${escapeHtml(line)}</p>`).join('')
        : '<p>Інструкції будуть додані найближчим часом.</p>';
    
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2 id="modalTitle" class="modal-title">${escapeHtml(project.title)}</h2>
            ${project.image ? `<img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)}" class="modal-image">` : ''}
        </div>
        <div class="modal-body">
            <div class="modal-meta">
                ${project.version ? `<div class="modal-meta-item"><strong>Версія локалізації:</strong> ${escapeHtml(project.version)}</div>` : ''}
                ${dateText ? `<div class="modal-meta-item"><strong>Дата локалізації:</strong> ${dateText}</div>` : ''}
                ${project.platform ? `<div class="modal-meta-item"><strong>Платформа:</strong> ${escapeHtml(project.platform)}</div>` : ''}
            </div>
            
            <div class="modal-section">
                <h3 class="modal-section-title">Як встановити локалізацію</h3>
                <div class="modal-instructions">
                    ${instructionsHtml}
                </div>
            </div>
            
            ${project.downloadUrl ? `
                <div class="modal-download">
                    <a href="${escapeHtml(project.downloadUrl)}" class="btn btn-primary btn-download" download data-project-title="${escapeHtml(project.title)}" data-project-version="${escapeHtml(project.version || 'unknown')}">
                        <span>Завантажити локалізацію</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="7 10 12 15 17 10"></polyline>
                            <line x1="12" y1="15" x2="12" y2="3"></line>
                        </svg>
                    </a>
                </div>
            ` : ''}
            
            <div class="modal-report-bug">
                <a href="mailto:sense5.studio.engineer@gmail.com?subject=${encodeURIComponent(project.title + ': Знайшов помилку')}" class="btn btn-report-bug">
                    <span>Повідомити про помилку</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        <line x1="9" y1="10" x2="15" y2="10"></line>
                        <line x1="12" y1="7" x2="12" y2="13"></line>
                    </svg>
                </a>
            </div>
        </div>
    `;
    
    const downloadBtn = modalContent.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const projectTitle = this.getAttribute('data-project-title');
            const projectVersion = this.getAttribute('data-project-version');
            
            if (typeof gtag !== 'undefined') {
                gtag('event', 'download', {
                    'event_category': 'localization',
                    'event_label': projectTitle,
                    'value': 1,
                    'version': projectVersion,
                    'project_title': projectTitle
                });
            }
        });
    }
    
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
    const modal = document.getElementById('projectModal');
    modal.setAttribute('aria-hidden', 'true');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function initModal() {
    const modal = document.getElementById('projectModal');
    const closeBtn = document.getElementById('modalClose');
    
    closeBtn.addEventListener('click', closeProjectModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeProjectModal();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeProjectModal();
        }
    });
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;
    
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme, themeIcon);
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme, themeIcon);
    });
}

function updateThemeIcon(theme, iconElement) {
    iconElement.textContent = theme === 'dark' ? '🌙' : '☀️';
}

function setFooterYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

function initDonateButtons() {
    // Menu donate button
    const menuDonateBtn = document.querySelector('.nav-link-donate');
    if (menuDonateBtn) {
        menuDonateBtn.addEventListener('click', function(e) {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'donate_click', {
                    'event_category': 'donation',
                    'event_label': 'menu_donate_button',
                    'location': 'navigation_menu'
                });
            }
        });
    }
    
    // Bottom section donate button
    const bottomDonateBtn = document.querySelector('.btn-donate-large');
    if (bottomDonateBtn) {
        bottomDonateBtn.addEventListener('click', function(e) {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'donate_click', {
                    'event_category': 'donation',
                    'event_label': 'bottom_donate_button',
                    'location': 'donate_section'
                });
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProjects();
    initThemeToggle();
    setFooterYear();
    initSmoothScroll();
    initModal();
    initDonateButtons();
});
