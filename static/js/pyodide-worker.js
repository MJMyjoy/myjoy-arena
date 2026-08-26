// ============================================
// PYODIDE WEB WORKER
// Executes Python code in a separate thread
// so infinite loops cannot freeze the browser.
// ============================================
let pyodide = null;

importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');

async function initPyodide() {
    if (pyodide) return pyodide;
    pyodide = await loadPyodide();
    return pyodide;
}

self.onmessage = async function(event) {
    const { type, code, inputs } = event.data;
    if (type === 'run') {
        try {
            const py = await initPyodide();

            py.runPython([
                'import sys',
                'from io import StringIO',
                'sys.stdout = StringIO()',
                'sys.stderr = StringIO()',
            ].join('\n'));

            py.runPython([
                'import builtins',
                '_input_values = []',
                '_input_index = 0',
                'def _custom_input(prompt=""):',
                '    global _input_index',
                '    if _input_index < len(_input_values):',
                '        val = _input_values[_input_index]',
                '        _input_index += 1',
                '        print(prompt + val)',
                '        return val',
                '    raise EOFError("Pas de valeur disponible. Utilise le champ Entrees.")',
                'builtins.input = _custom_input',
            ].join('\n'));

            if (inputs && inputs.length > 0) {
                py.runPython('_input_values = ' + JSON.stringify(inputs) + '\n_input_index = 0');
            }

            // Clear global namespace to prevent variable leaking between runs
            py.runPython([
                '_to_keep = {"__name__", "__doc__", "__package__", "__loader__", "__spec__", "__annotations__", "__builtins__", "sys", "StringIO", "builtins", "_input_values", "_input_index", "_custom_input"}',
                'for _k in list(globals().keys()):',
                '    if _k not in _to_keep:',
                '        del globals()[_k]'
            ].join('\n'));

            py.runPython(code);

            const stdout = py.runPython('sys.stdout.getvalue()');
            const stderr = py.runPython('sys.stderr.getvalue()');
            self.postMessage({ type: 'result', success: true, output: stdout, error: stderr });
        } catch (e) {
            let stderr = '';
            try { if (pyodide) stderr = pyodide.runPython('sys.stderr.getvalue()'); } catch (_) {}
            self.postMessage({ type: 'result', success: false, output: '', error: e.message || stderr || String(e) });
        }
    }
};

initPyodide().then(function() {
    self.postMessage({ type: 'ready' });
}).catch(function(e) {
    self.postMessage({ type: 'error', error: 'Impossible de charger Python : ' + e.message });
});