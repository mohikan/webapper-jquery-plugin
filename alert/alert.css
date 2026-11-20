// innerHTML ile eklenen <script> tag'leri calismaz; yeniden olusturup calistir
function adminAlertRunScripts(root) {
  root.querySelectorAll('script').forEach(old => {
    const s = document.createElement('script');
    for (const attr of old.attributes) s.setAttribute(attr.name, attr.value);
    s.textContent = old.textContent;
    old.replaceWith(s);
  });
}

var AdminAlert = {
  container: null,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'admin-toast-container';
      document.body.appendChild(this.container);
    }
  },

  toast(type, title, message, duration = 3000) {
    this.init();
    const icons = {
      success: 'check_circle',
      danger: 'error',
      warning: 'warning',
      info: 'info'
    };

    const el = document.createElement('div');
    el.className = `admin-toast ${type}`;
    el.innerHTML = `
      <span class="material-symbols-outlined admin-toast-icon">${icons[type] || 'info'}</span>
      <div class="admin-toast-content">
        <div class="admin-toast-message">${message}</div>
      </div>
      <button class="admin-toast-close" onclick="this.parentElement.remove()">
        <span class="material-symbols-outlined" style="font-size:18px">close</span>
      </button>
    `;

    this.container.appendChild(el);

    if (duration > 0) {
      setTimeout(() => {
        el.style.animation = 'slideUp 0.3s ease forwards';
        setTimeout(() => el.remove(), 300);
      }, duration);
    }
  },

  success(title, message, duration) {
    this.toast('success', title, message, duration);
  },

  error(title, message, duration) {
    this.toast('danger', title, message, duration);
  },

  warning(title, message, duration) {
    this.toast('warning', title, message, duration);
  },

  info(title, message, duration) {
    this.toast('info', title, message, duration);
  },

  confirm(options = {}) {
    const {
      title = 'Are you sure?',
      message = 'This action cannot be undone.',
      type = 'warning',
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      showCancel = true,
      onConfirm = () => {},
      onCancel = () => {}
    } = options;

    const icons = {
      warning: 'warning',
      danger: 'error',
      success: 'check_circle',
      info: 'info'
    };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-header-center">
          <span class="material-symbols-outlined modal-icon ${type}">${icons[type] || icons.info}</span>
          <h3>${title}</h3>
        </div>
        <div class="modal-body">${message}</div>
        <div class="modal-footer">
          ${showCancel ? `<button class="btn-text" id="modal-cancel">${cancelText}</button>` : ''}
          <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" id="modal-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cancelBtn = overlay.querySelector('#modal-cancel');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        overlay.remove();
        onCancel();
      };
    }

    overlay.querySelector('#modal-confirm').onclick = () => {
      overlay.remove();
      onConfirm();
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        onCancel();
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        onCancel();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  },

  form(options = {}) {
    const {
      title = 'Form',
      type = 'info',
      url = '',
      html = '',
      submitText = 'Submit',
      cancelText = 'Cancel',
      onLoad = () => {},
      onSubmit = () => {},
      onCancel = () => {}
    } = options;

    // acik form modali varsa once onu kapat — ustuste modal birikmesin
    document.querySelectorAll('.modal-overlay').forEach(function (o) {
      if (o.querySelector('#modal-form')) o.remove();
    });

    const icons = {
      warning: 'warning',
      danger: 'error',
      success: 'check_circle',
      info: 'info'
    };

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box modal-box-lg">
        <div class="modal-header">
          <h3>${title}</h3>
        </div>
        <div class="modal-body">
          <form id="modal-form"></form>
        </div>
        <div class="modal-footer">
          <button class="btn-text" id="modal-cancel">${cancelText}</button>
          <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" id="modal-submit">${submitText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (html) {
      overlay.querySelector('#modal-form').innerHTML = html;
      adminAlertRunScripts(overlay.querySelector('#modal-form'));
      onLoad();
    } else if (url) {
      fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(r => r.text())
        .then(html => {
          const form = overlay.querySelector('#modal-form');
          form.innerHTML = html;
          if (!form.getAttribute('action')) {
            form.setAttribute('action', url);
          }
          adminAlertRunScripts(form);
          onLoad();
        })
        .catch(() => {
          overlay.querySelector('#modal-form').innerHTML = '<p class="text-muted">Failed to load content</p>';
        });
    }

    overlay.querySelector('#modal-cancel').onclick = () => {
      overlay.remove();
      onCancel();
    };

    overlay.querySelector('#modal-submit').onclick = () => {
      const form = overlay.querySelector('#modal-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const action = form.getAttribute('action') || url;
      // modal hata durumunda acik kalsin; basari/redirect/webapper doWorks kapatacak
      onSubmit(data, formData, action);
    };

    overlay.onclick = (e) => {
      if (e.target === overlay) {
        overlay.remove();
        onCancel();
      }
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        onCancel();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  },

  offcanvas(options = {}) {
    const {
      title = 'Panel',
      type = 'info',
      url = '',
      submitText = 'Submit',
      cancelText = 'Cancel',
      onLoad = () => {},
      onSubmit = () => {},
      onCancel = () => {}
    } = options;

    const icons = {
      warning: 'warning',
      danger: 'error',
      success: 'check_circle',
      info: 'info'
    };

    const overlay = document.createElement('div');
    overlay.className = 'offcanvas-overlay';
    
    const panel = document.createElement('div');
    panel.className = 'offcanvas';
    panel.innerHTML = `
      <div class="offcanvas-header">
        <h3>${title}</h3>
        <button class="offcanvas-close" id="offcanvas-close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="offcanvas-body">
        <form id="offcanvas-form"></form>
      </div>
      <div class="offcanvas-footer">
        <button class="btn-text" id="offcanvas-cancel">${cancelText}</button>
        <button class="btn btn-${type === 'danger' ? 'danger' : 'primary'}" id="offcanvas-submit">${submitText}</button>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      panel.classList.add('show');
    });

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(r => r.text())
      .then(html => {
        const form = panel.querySelector('#offcanvas-form');
        form.innerHTML = html;
        if (!form.getAttribute('action')) {
          form.setAttribute('action', url);
        }
        onLoad();
      })
      .catch(() => {
        panel.querySelector('#offcanvas-form').innerHTML = '<p class="text-muted">Failed to load content</p>';
      });

    const close = () => {
      panel.classList.remove('show');
      setTimeout(() => {
        overlay.remove();
        panel.remove();
      }, 300);
    };

    overlay.onclick = () => {
      close();
      onCancel();
    };

    panel.querySelector('#offcanvas-close').onclick = () => {
      close();
      onCancel();
    };

    panel.querySelector('#offcanvas-cancel').onclick = () => {
      close();
      onCancel();
    };

    panel.querySelector('#offcanvas-submit').onclick = () => {
      const form = panel.querySelector('#offcanvas-form');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      const action = form.getAttribute('action') || url;
      close();
      onSubmit(data, formData, action);
    };

    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        close();
        onCancel();
        document.removeEventListener('keydown', handleEsc);
      }
    };
    document.addEventListener('keydown', handleEsc);
  }
};
