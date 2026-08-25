// ============================================
// SPLASH SCREEN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 600);
        }, 2500);
    }
});

// ============================================
// SCROLL ANIMATIONS (Intersection Observer)
// ============================================
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
});

// ============================================
// PYODIDE INTEGRATION
// ============================================
let pyodideInstance = null;
let pyodideLoading = false;

async function loadPyodideInstance() {
    if (pyodideInstance) return pyodideInstance;
    if (pyodideLoading) {
        // Wait for loading to complete
        while (pyodideLoading) {
            await new Promise(r => setTimeout(r, 100));
        }
        return pyodideInstance;
    }
    pyodideLoading = true;
    const statusEl = document.getElementById('pyodide-status');
    if (statusEl) statusEl.textContent = '⏳ Chargement de Python...';
    try {
        pyodideInstance = await loadPyodide();
        if (statusEl) statusEl.textContent = '✅ Python est prêt !';
        pyodideLoading = false;
        return pyodideInstance;
    } catch (e) {
        if (statusEl) statusEl.textContent = '❌ Erreur de chargement de Python';
        pyodideLoading = false;
        throw e;
    }
}

async function runPythonCode(code) {
    const pyodide = await loadPyodideInstance();
    
    // Redirect stdout and stderr
    pyodide.runPython(`
import sys
from io import StringIO
sys.stdout = StringIO()
sys.stderr = StringIO()
    `);
    
    // Handle input() by replacing it with a custom function
    // For now, we'll use a prompt-based approach
    pyodide.runPython(`
import builtins
_original_input = builtins.input
_input_values = []
_input_index = 0
def _custom_input(prompt=''):
    global _input_index
    if _input_index < len(_input_values):
        val = _input_values[_input_index]
        _input_index += 1
        print(prompt + val)
        return val
    raise EOFError('Pas de valeur d\\'entrée disponible. Utilise le champ "Entrées" pour fournir des valeurs.')
builtins.input = _custom_input
    `);
    
    try {
        // Set input values if provided
        const inputArea = document.getElementById('input-values');
        if (inputArea && inputArea.value.trim()) {
            const inputs = inputArea.value.split('\n');
            pyodide.runPython(`_input_values = ${JSON.stringify(inputs)}\n_input_index = 0`);
        }
        
        pyodide.runPython(code);
        const stdout = pyodide.runPython('sys.stdout.getvalue()');
        const stderr = pyodide.runPython('sys.stderr.getvalue()');
        return { success: true, output: stdout, error: stderr };
    } catch (e) {
        const stderr = pyodide.runPython('sys.stderr.getvalue()');
        return { success: false, output: '', error: e.message || stderr };
    }
}

// ============================================
// PYTHON ERROR REFORMULATION IN FRENCH
// ============================================
const ERROR_MESSAGES = {
    'SyntaxError': {
        pattern: /SyntaxError/,
        message: "🔤 Erreur de syntaxe ! Il y a une petite faute dans l'écriture de ton code. Vérifie les parenthèses, les deux-points (:) et les guillemets. Tu y es presque !",
        details: {
            'EOL while scanning string literal': "Tu as oublié de fermer un guillemet (\" ou '). Chaque guillemet ouvert doit être fermé !",
            'unexpected EOF while parsing': "Il manque quelque chose à la fin de ton code. Peut-être une parenthèse ) ou un crochet ] ?",
            'invalid syntax': "Python ne comprend pas cette ligne. Vérifie l'orthographe des mots-clés (if, for, def, etc.) et la ponctuation.",
            'expected an indented block': "Python s'attend à trouver du code indenté (décalé) après les deux-points (:). Ajoute des espaces au début de la ligne suivante.",
        }
    },
    'IndentationError': {
        pattern: /IndentationError/,
        message: "📏 Erreur d'indentation ! En Python, les espaces en début de ligne sont très importants. Vérifie que ton code est bien aligné. Utilise 4 espaces pour chaque niveau.",
        details: {
            'unexpected indent': "Cette ligne a trop d'espaces au début. Aligne-la avec les lignes du même bloc.",
            'expected an indented block': "Il faut ajouter des espaces (4 espaces) au début de la ligne après un if, for, while, def, etc.",
        }
    },
    'NameError': {
        pattern: /NameError.*name '(\w+)' is not defined/,
        message: "🏷️ Erreur de nom ! Python ne reconnaît pas le mot '{name}'. Soit tu as fait une faute de frappe, soit tu as oublié de créer cette variable avant de l'utiliser. Courage !",
    },
    'TypeError': {
        pattern: /TypeError/,
        message: "🔀 Erreur de type ! Tu essaies de mélanger des choses qui ne vont pas ensemble (par exemple, additionner un texte et un nombre). Utilise str() ou int() pour convertir.",
        details: {
            'can only concatenate str': "Tu essaies de coller un texte avec un nombre. Utilise str(nombre) pour convertir le nombre en texte.",
            'unsupported operand type': "Cette opération ne marche pas avec ces types de données. Vérifie que tu utilises les bons types.",
            'takes .* positional argument': "Tu n'as pas donné le bon nombre d'arguments à cette fonction. Vérifie combien elle en attend.",
        }
    },
    'ValueError': {
        pattern: /ValueError/,
        message: "📊 Erreur de valeur ! La valeur que tu as donnée n'est pas du bon format. Par exemple, int('abc') ne marche pas car 'abc' n'est pas un nombre.",
    },
    'IndexError': {
        pattern: /IndexError/,
        message: "📋 Erreur d'index ! Tu essaies d'accéder à un élément qui n'existe pas dans ta liste. N'oublie pas que les index commencent à 0 en Python !",
    },
    'KeyError': {
        pattern: /KeyError/,
        message: "🔑 Erreur de clé ! La clé que tu cherches n'existe pas dans ton dictionnaire. Vérifie l'orthographe ou utilise .get() pour éviter cette erreur.",
    },
    'AttributeError': {
        pattern: /AttributeError.*'(\w+)' object has no attribute '(\w+)'/,
        message: "🔧 Erreur d'attribut ! L'objet de type '{type}' n'a pas de propriété ou méthode '{attr}'. Vérifie l'orthographe ou le type de ta variable.",
    },
    'ZeroDivisionError': {
        pattern: /ZeroDivisionError/,
        message: "➗ Division par zéro ! On ne peut pas diviser par zéro en mathématiques (ni en Python !). Vérifie la valeur de ton diviseur.",
    },
    'FileNotFoundError': {
        pattern: /FileNotFoundError/,
        message: "📁 Fichier introuvable ! Le fichier que tu cherches n'existe pas. Dans cet éditeur en ligne, tu ne peux pas accéder aux fichiers de ton ordinateur.",
    },
    'ImportError': {
        pattern: /ImportError|ModuleNotFoundError/,
        message: "📦 Erreur d'importation ! Le module que tu essaies d'importer n'est pas disponible. Dans cet éditeur, seuls les modules standards de Python sont disponibles.",
    },
    'RecursionError': {
        pattern: /RecursionError/,
        message: "🔄 Erreur de récursion ! Ta fonction s'appelle elle-même trop de fois. Vérifie que tu as bien une condition d'arrêt dans ta fonction récursive.",
    },
    'EOFError': {
        pattern: /EOFError/,
        message: "⌨️ Ton code utilise input() pour demander une saisie. Remplis le champ 'Entrées utilisateur' ci-dessous avec les valeurs attendues (une par ligne) puis relance !",
    },
    'OverflowError': {
        pattern: /OverflowError/,
        message: "💥 Dépassement ! Le nombre est trop grand pour être traité. Essaie avec des valeurs plus petites.",
    },
    'StopIteration': {
        pattern: /StopIteration/,
        message: "🛑 L'itérateur est arrivé au bout ! Tu essaies de lire un élément de plus que ce qui est disponible dans ton itérateur.",
    },
};

function reformulateError(errorMessage) {
    for (const [errorType, config] of Object.entries(ERROR_MESSAGES)) {
        if (config.pattern.test(errorMessage)) {
            let msg = config.message;
            
            // Try to extract specific details
            if (config.details) {
                for (const [key, detail] of Object.entries(config.details)) {
                    if (errorMessage.includes(key)) {
                        msg += '\n\n💡 Détail : ' + detail;
                        break;
                    }
                }
            }
            
            // Replace placeholders with extracted values
            const nameMatch = errorMessage.match(/name '(\w+)' is not defined/);
            if (nameMatch) msg = msg.replace('{name}', nameMatch[1]);
            
            const attrMatch = errorMessage.match(/'(\w+)' object has no attribute '(\w+)'/);
            if (attrMatch) {
                msg = msg.replace('{type}', attrMatch[1]).replace('{attr}', attrMatch[2]);
            }
            
            // Add the original error for reference
            msg += '\n\n📝 Message original : ' + errorMessage.split('\n').pop();
            
            return msg;
        }
    }
    // Fallback for unknown errors
    return "🤔 Une erreur s'est produite. Pas de panique, c'est normal quand on apprend !\n\n📝 Message : " + errorMessage + "\n\n💡 Conseil : Relis ton code ligne par ligne et vérifie la syntaxe.";
}

// ============================================
// CODE EDITOR SETUP (CodeMirror 5)
// ============================================
let codeEditor = null;

function initCodeEditor() {
    const textarea = document.getElementById('code-editor');
    if (!textarea || codeEditor) return;
    
    codeEditor = CodeMirror.fromTextArea(textarea, {
        mode: 'python',
        theme: 'monokai',
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        autoCloseBrackets: true,
        matchBrackets: true,
        lineWrapping: true,
        extraKeys: {
            'Tab': (cm) => cm.replaceSelection('    ', 'end'),
            'Ctrl-Enter': () => executeCode(),
            'Cmd-Enter': () => executeCode(),
        },
        placeholder: '# Écris ton code Python ici...\nprint("Hello, World !")\n',
    });
    codeEditor.setSize('100%', '350px');
}

// ============================================
// CODE EXECUTION
// ============================================
async function executeCode() {
    const outputArea = document.getElementById('output-area');
    const runBtn = document.getElementById('run-btn');
    if (!outputArea) return;
    
    let code = '';
    if (codeEditor) {
        code = codeEditor.getValue();
    } else {
        // On detail page, get from readonly CodeMirror or textarea
        const readonlyEl = document.getElementById('readonly-code');
        const editorEl = document.getElementById('code-editor');
        const cmInstance = readonlyEl && readonlyEl.nextSibling && readonlyEl.nextSibling.CodeMirror;
        if (cmInstance) {
            code = cmInstance.getValue();
        } else if (readonlyEl) {
            code = readonlyEl.value;
        } else if (editorEl) {
            code = editorEl.value;
        }
    }
    
    if (!code.trim()) {
        outputArea.innerHTML = '<div class="output-message info">✏️ Écris du code avant de l\\'exécuter !</div>';
        return;
    }
    
    // Show loading
    outputArea.innerHTML = '<div class="output-message loading">⏳ Exécution en cours...</div>';
    if (runBtn) { runBtn.disabled = true; runBtn.textContent = '⏳ Exécution...'; }
    
    try {
        const result = await runPythonCode(code);
        
        if (result.success) {
            let html = '';
            if (result.output) {
                html += `<div class="output-message success"><pre>${escapeHtml(result.output)}</pre></div>`;
            } else {
                html += '<div class="output-message success">✅ Code exécuté avec succès ! (pas de sortie)</div>';
            }
            if (result.error) {
                html += `<div class="output-message warning"><pre>${escapeHtml(result.error)}</pre></div>`;
            }
            outputArea.innerHTML = html;
            // Enable next step if in create form
            const nextBtn = document.getElementById('step3-next');
            if (nextBtn) nextBtn.disabled = false;
            // Store output
            window._lastOutput = result.output || '(aucune sortie)';
        } else {
            const friendlyError = reformulateError(result.error);
            outputArea.innerHTML = `<div class="output-message error"><div class="error-friendly">${escapeHtml(friendlyError).replace(/\n/g, '<br>')}</div></div>`;
            window._lastOutput = '';
        }
    } catch (e) {
        const friendlyError = reformulateError(e.message || String(e));
        outputArea.innerHTML = `<div class="output-message error"><div class="error-friendly">${escapeHtml(friendlyError).replace(/\n/g, '<br>')}</div></div>`;
    } finally {
        if (runBtn) { runBtn.disabled = false; runBtn.textContent = '▶️ Exécuter le code'; }
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// STEPPER LOGIC (Create Project Page)
// ============================================
let currentStep = 1;
const totalSteps = 4;

function goToStep(step) {
    if (step < 1 || step > totalSteps) return;
    
    // Validate current step before advancing
    if (step > currentStep) {
        if (!validateStep(currentStep)) return;
    }
    
    // Hide all steps
    document.querySelectorAll('.step-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step-${step}`);
    if (targetStep) targetStep.classList.add('active');
    
    // Update progress bar
    document.querySelectorAll('.step-indicator').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < step) el.classList.add('completed');
        if (i + 1 === step) el.classList.add('active');
    });
    
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        progressBar.style.width = `${((step - 1) / (totalSteps - 1)) * 100}%`;
    }
    
    currentStep = step;
    
    // Init CodeMirror when entering step 3
    if (step === 3) {
        setTimeout(() => {
            initCodeEditor();
            if (codeEditor) codeEditor.refresh();
        }, 100);
    }
}

function validateStep(step) {
    switch(step) {
        case 1:
            const name = document.getElementById('author-name');
            if (!name || !name.value.trim()) {
                name.classList.add('input-error');
                showToast('Merci d\\'entrer ton nom ou surnom !', 'warning');
                return false;
            }
            name.classList.remove('input-error');
            return true;
        case 2:
            const title = document.getElementById('project-title');
            if (!title || !title.value.trim()) {
                title.classList.add('input-error');
                showToast('Donne un titre à ton projet !', 'warning');
                return false;
            }
            title.classList.remove('input-error');
            return true;
        case 3:
            return true; // Allow going to step 4 even without running code
        default:
            return true;
    }
}

// ============================================
// SAVE PROJECT
// ============================================
async function saveProject() {
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = '⏳ Enregistrement...'; }
    
    const data = {
        author_name: document.getElementById('author-name').value.trim(),
        title: document.getElementById('project-title').value.trim(),
        code: codeEditor ? codeEditor.getValue() : '',
        notes: document.getElementById('project-notes')?.value.trim() || '',
        category: document.getElementById('project-category')?.value || '',
        output: window._lastOutput || '',
    };
    
    try {
        const response = await fetch('/api/save-project/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const result = await response.json();
        
        if (result.success) {
            showSuccessOverlay(result.project_id);
        } else {
            showToast('Erreur: ' + result.message, 'error');
        }
    } catch (e) {
        showToast('Erreur de connexion. Réessaie !', 'error');
    } finally {
        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = '💾 Enregistrer mon projet'; }
    }
}

function showSuccessOverlay(projectId) {
    const overlay = document.getElementById('success-overlay');
    if (overlay) {
        overlay.classList.add('active');
        const viewLink = overlay.querySelector('.view-project-link');
        if (viewLink) viewLink.href = `/project/${projectId}/`;
    }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// ============================================
// CATEGORY FILTER (Home page)
// ============================================
function filterByCategory(categorySlug) {
    const cards = document.querySelectorAll('.project-card');
    const buttons = document.querySelectorAll('.filter-btn');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    cards.forEach(card => {
        if (categorySlug === 'all' || card.dataset.category === categorySlug) {
            card.style.display = '';
            card.classList.add('animate-in');
        } else {
            card.style.display = 'none';
        }
    });
}

// ============================================
// MOBILE NAVBAR TOGGLE
// ============================================
function toggleMobileMenu() {
    const nav = document.querySelector('.nav-links');
    if (nav) nav.classList.toggle('active');
}

// ============================================
// INIT ON DOM READY
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Init CodeMirror if on create page and step 3 is already visible
    if (document.getElementById('code-editor') && document.querySelector('.step-content.active #code-editor')) {
        initCodeEditor();
    }
    
    // Init read-only CodeMirror on project detail page
    const readOnlyEditor = document.getElementById('readonly-code');
    if (readOnlyEditor) {
        CodeMirror.fromTextArea(readOnlyEditor, {
            mode: 'python',
            theme: 'monokai',
            lineNumbers: true,
            readOnly: true,
            lineWrapping: true,
        });
    }
    
    // Start loading Pyodide in background on pages that need it
    if (document.getElementById('code-editor') || document.getElementById('readonly-code')) {
        loadPyodideInstance().catch(() => {});
    }
});
