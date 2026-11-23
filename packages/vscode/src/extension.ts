import { scanBuffer } from '@sentry/core';
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('sentry.scan', () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showInformationMessage('No active file to scan.');
			return;
		}

		const document = editor.document;
		const findings = scanBuffer(Buffer.from(document.getText()));

		if (findings.length === 0) {
			vscode.window.showInformationMessage('SentryScan: No secrets detected.');
			return;
		}

		const diagnosticCollection = vscode.languages.createDiagnosticCollection('sentry-scan');
		const diagnostics: vscode.Diagnostic[] = [];

		for (const finding of findings) {
			const line = finding.line !== undefined ? finding.line - 1 : 0;
			const position = new vscode.Position(line, 0);
			const range = new vscode.Range(position, position);
			const severity = finding.severity === 'critical'
				? vscode.DiagnosticSeverity.Error
				: finding.severity === 'high'
					? vscode.DiagnosticSeverity.Warning
					: vscode.DiagnosticSeverity.Information;
			const diagnostic = new vscode.Diagnostic(
				range,
				`[${finding.id}] Potential secret detected: ${finding.redacted}`,
				severity
			);
			diagnostics.push(diagnostic);
		}

		diagnosticCollection.set(document.uri, diagnostics);
		diagnosticCollection.dispose();

		vscode.window.showInformationMessage(
			`SentryScan: Found ${findings.length} potential secret(s). Check the Problems panel.`
		);
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {
	// No-op
}
