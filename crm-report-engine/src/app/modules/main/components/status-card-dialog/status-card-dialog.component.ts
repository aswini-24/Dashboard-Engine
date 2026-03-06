// status-card-dialog.component.ts
import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatCheckboxModule, MatCheckboxChange } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-status-card-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatListModule,
    MatCheckboxModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <h2 mat-dialog-title>Color Config</h2>

    <mat-dialog-content>
      <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
        <mat-form-field appearance="outline" style="flex:1;">
          <input matInput placeholder="Add new value" [(ngModel)]="newValue" (keydown.enter)="onAddNew()" />
        </mat-form-field>

        <button
          mat-flat-button
          type="button"
          (click)="onAddNew()"
          [disabled]="!canAdd()"
          [ngStyle]="buttonStyle"
        >
          <mat-icon style="margin-right:6px;">add</mat-icon> Add
        </button>
      </div>

      <p *ngIf="values.length === 0">No values available for this key.</p>

      <!-- Custom list: selection controlled only by the checkbox -->
      <div style="display:flex; flex-direction:column; gap:6px;">
        <div
          *ngFor="let v of values"
          class="status-row"
          style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:8px; border-radius:6px;"
          (click)="$event.stopPropagation()"
        >
          <div style="display:flex; align-items:center; gap:12px; flex:1; min-width:0;">
            <mat-checkbox
              [checked]="isSelected(v)"
              (change)="onCheckboxChange($event, v)"
              (click)="$event.stopPropagation()"
            ></mat-checkbox>

            <div style="flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              {{ v }}
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:8px; margin-left:12px;">
            <input
              type="color"
              [(ngModel)]="selectedColors[v]"
              (ngModelChange)="onColorPickerChange(v, $event)"
              (click)="$event.stopPropagation()"
              (mousedown)="$event.stopPropagation()"
              [title]="'Color for ' + v"
              style="width:34px; height:34px; border:none; padding:0; cursor:pointer; border-radius:4px;"
            />

            <mat-form-field appearance="outline" style="width:140px; margin:0;">
              <input
                matInput
                placeholder="#rrggbb"
                [(ngModel)]="colorInputs[v]"
                (ngModelChange)="onColorInputChange(v, true)"
                (click)="$event.stopPropagation()"
                (mousedown)="$event.stopPropagation()"
              />
            </mat-form-field>
          </div>
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" style="margin-top:12px;">
      <button mat-button (click)="onCancel()" [ngStyle]="cancelButtonStyle">Cancel</button>
      <button
        mat-flat-button
        (click)="onSubmit()"
        [disabled]="selectedValues.length === 0"
        [ngStyle]="submitButtonStyle"
      >
        Submit
      </button>
    </mat-dialog-actions>
  `
})
export class StatusCardDialogComponent {
  values: string[] = [];
  selectedValues: string[] = [];
  newValue: string = '';

  // map of value -> hex color (string, always normalized to #rrggbb when present)
  selectedColors: Record<string, string> = {};

  // separate two-way binding for text inputs per value (the raw typed text)
  colorInputs: Record<string, string> = {};

  // style objects for inline colorization of buttons
  primaryColor = '#ee4961';
  buttonStyle = { 'background-color': this.primaryColor, color: '#fff' };
  submitButtonStyle = { 'background-color': this.primaryColor, color: '#fff' };
  cancelButtonStyle = { color: '#333', 'background-color': 'transparent' };

  constructor(
    public dialogRef: MatDialogRef<StatusCardDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { key: string; values: any[]; selected?: any[]; colors?: Record<string, string> }
  ) {
    // clone initial values
    this.values = Array.isArray(data.values) ? [...data.values.map(String)] : [];

    // --- Palette from user (your provided list) ---
    // user-supplied palette strings (no leading '#')
    const userColorStrings = ['ffa512', 'fff200', 'c0392b', 'ffa512', '009432', 'b5050b'];

    // normalize user palette entries to #rrggbb when possible; fallback to primaryColor
    const palette: string[] = userColorStrings.map(c => {
      const raw = String(c || '').trim();
      const normalized = this.normalizeHex(raw) ?? this.bestEffortHex(raw);
      return normalized ?? this.primaryColor;
    });

    // Initialize selectedColors and colorInputs:
    // Priority order for each value:
    //   1) caller-supplied color in data.colors (preferred & normalized)
    //   2) palette[idx]  (for first N values)
    //   3) primaryColor (fallback)
    this.values.forEach((val, idx) => {
      const key = String(val);

      // prefer caller-supplied color when present
      const providedRaw = data?.colors && data.colors[key] ? String(data.colors[key]) : null;
      const normalizedProvided = providedRaw ? (this.normalizeHex(providedRaw) ?? this.bestEffortHex(providedRaw)) : null;

      if (normalizedProvided) {
        // use normalized caller color
        this.selectedColors[key] = normalizedProvided;
        this.colorInputs[key] = normalizedProvided;
      } else {
        // otherwise use palette for the first entries; others fallback to primaryColor
        const assigned = idx < palette.length ? palette[idx] : this.primaryColor;
        this.selectedColors[key] = assigned;
        this.colorInputs[key] = assigned;
      }
    });

    // selected values: if provided, use them; otherwise default to select ALL values
    if (Array.isArray(data.selected) && data.selected.length > 0) {
      this.selectedValues = data.selected.map(String);
      // ensure preselected values present and colors initialized
      data.selected.forEach((s: any) => {
        const key = String(s);
        if (!this.values.includes(key)) this.values.push(key);
        if (!this.selectedColors[key]) {
          this.selectedColors[key] = this.primaryColor;
          this.colorInputs[key] = this.primaryColor;
        }
      });
    } else {
      // default: select everything
      this.selectedValues = [...this.values];
    }

    // ensure colorInputs exist for all values and selectedColors are normalized
    this.values.forEach(v => {
      if (!this.colorInputs[v]) this.colorInputs[v] = this.selectedColors[v] ?? this.primaryColor;
      const normalized = this.normalizeHex(this.selectedColors[v] ?? '') ?? this.bestEffortHex(this.selectedColors[v] ?? '');
      if (normalized) this.selectedColors[v] = normalized;
    });
  }

  isSelected(v: string) {
    return this.selectedValues.includes(v);
  }

  /** checkbox change handler: only this toggles selection */
  onCheckboxChange(event: MatCheckboxChange, value: string) {
    const key = String(value);
    if (event.checked) {
      if (!this.selectedValues.includes(key)) this.selectedValues.push(key);
    } else {
      this.selectedValues = this.selectedValues.filter(x => x !== key);
    }

    // ensure selected items have a color default
    if (event.checked && !this.selectedColors[key]) {
      this.selectedColors[key] = this.primaryColor;
      this.colorInputs[key] = this.primaryColor;
    }
  }

  canAdd(): boolean {
    return !!this.newValue && this.newValue.trim().length > 0;
  }

  onAddNew() {
    const v = this.newValue?.trim();
    if (!v) return;
    const key = String(v);

    // add if not present
    if (!this.values.includes(key)) {
      this.values.push(key);
    }

    // select it (checkbox)
    if (!this.selectedValues.includes(key)) {
      this.selectedValues.push(key);
    }

    // assign default color (and set input) — keep primaryColor for new entries (per request)
    this.selectedColors[key] = this.primaryColor;
    this.colorInputs[key] = this.primaryColor;

    this.newValue = '';
  }

  /**
   * Called when the native color picker changes.
   * The color value from <input type="color"> will be a valid #rrggbb.
   */
  onColorPickerChange(value: string, hex: string) {
    const key = String(value);
    if (!hex) return;
    const normalized = this.normalizeHex(hex) ?? hex;
    this.selectedColors[key] = normalized;
    this.colorInputs[key] = normalized;
  }

  /**
   * Called when the user changes the text hex field.
   * With `live=true` this will apply a best-effort full hex for preview as you type.
   * When the typed value is a valid hex, it will be normalized to `#rrggbb`.
   */
  onColorInputChange(value: string, live = true) {
    const key = String(value);
    const typed = (this.colorInputs[key] || '').trim();

    // empty typed -> leave the currently applied color as-is (avoid clearing color picker)
    if (!typed) {
      return;
    }

    // if fully valid, normalize and apply
    const normalized = this.normalizeHex(typed);
    if (normalized) {
      this.selectedColors[key] = normalized;
      this.colorInputs[key] = normalized;
      return;
    }

    // if invalid but live-preview requested, compute a best-effort full hex and apply for preview
    if (live) {
      const best = this.bestEffortHex(typed);
      if (best) {
        this.selectedColors[key] = best;
      }
      // keep the typed text in the input until user finishes/validates
      this.colorInputs[key] = typed;
      return;
    }

    // non-live invalid: keep the typed value but do not apply a new color
    this.colorInputs[key] = typed;
  }

  /**
   * Strict normalize hex to #rrggbb (lowercase). Accepts:
   * - 'abc' -> '#aabbcc'
   * - '#abc' -> '#aabbcc'
   * - '#aabbcc' -> '#aabbcc'
   * Returns null for invalid input.
   */
  normalizeHex(input?: string): string | null {
    if (!input) return null;
    let hex = input.trim();
    if (!hex) return null;
    if (!hex.startsWith('#')) hex = '#' + hex;
    const three = /^#([0-9A-Fa-f]{3})$/;
    const six = /^#([0-9A-Fa-f]{6})$/;
    if (three.test(hex)) {
      const m = three.exec(hex);
      if (!m) return null;
      const r = m[1][0];
      const g = m[1][1];
      const b = m[1][2];
      return ('#' + r + r + g + g + b + b).toLowerCase();
    }
    if (six.test(hex)) {
      return hex.toLowerCase();
    }
    return null;
  }

  /**
   * Best-effort hex generator from partial/dirty input:
   * - strips non-hex chars,
   * - truncates to 6 chars,
   * - if length === 3 expands to 6,
   * - if length < 6 pads by repeating the last hex char to reach 6.
   * Returns null when there's no hex chars at all.
   */
  bestEffortHex(input?: string): string | null {
    if (!input) return null;
    const cleaned = String(input).replace(/[^0-9A-Fa-f]/g, '');
    if (!cleaned) return null;
    let s = cleaned.slice(0, 6);
    if (s.length === 3) {
      // expand rgb -> rrggbb
      s = s.split('').map(c => c + c).join('');
    } else if (s.length < 6) {
      const padChar = s[s.length - 1] || '0';
      while (s.length < 6) s += padChar;
    }
    return ('#' + s).toLowerCase();
  }

  onCancel() {
    this.dialogRef.close({ confirmed: false });
  }

  onSubmit() {
    const deduped = Array.from(new Set(this.selectedValues));
    // build a colors map only for selected items (use defaults when missing)
    const colors: Record<string, string> = {};
    deduped.forEach(v => {
      colors[v] = this.selectedColors[v] ?? this.primaryColor;
    });
    this.dialogRef.close({ confirmed: true, selected: deduped, colors });
  }
}
