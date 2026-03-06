import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { InputSearchComponent } from 'shared-lib';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SubSink } from 'subsink';
import { CrmService } from '../../services/crm.service';
import { CdkDragDrop, CdkDropList, CdkDrag, moveItemInArray, CdkDragHandle } from '@angular/cdk/drag-drop';
import { ErrorService } from '../../../../../../../shared-lib/src/lib/services/shared/error/error.service';
import { NgxSpinnerModule } from "ngx-spinner";
import { NgxSpinnerService } from 'ngx-spinner';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { ToasterService } from '../../../../../../../shared-lib/src/lib/services/shared/toaster-service/toaster.service';
import { ColDef } from 'ag-grid-community';
// ADD THESE IMPORTS
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { Dialog } from '@angular/cdk/dialog';
import { StatusCardDialogComponent } from '../../components/status-card-dialog/status-card-dialog.component';
import sweetAlert from 'sweetalert2';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SharedCustomComponent } from '../../components/shared-custom/shared-custom.component';
import Swal from 'sweetalert2';
// import { UtilityService } from 'src/app/services/utility/utility.service';

@Component({
  selector: 'app-report-engine-creation-page',
  standalone: true,
  imports: [
    MatInputModule,
    MatFormFieldModule,
    InputSearchComponent,
    MatIconModule,
    ReactiveFormsModule,
    FormsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatCardModule,
    NgxSpinnerModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatCheckboxModule,
    MatExpansionModule,
    MatSelectModule,
    MatRadioModule,
    CommonModule,

    // ADDED FOR DIALOG & MULTI-SELECT
    MatDialogModule,
    MatListModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatChipsModule,
  ],

  templateUrl: './report-engine-creation-page.component.html',
  styleUrl: './report-engine-creation-page.component.scss'
})
export class ReportEngineCreationPageComponent implements OnInit {

  reportEngineForm: FormGroup;
  messData: any[] = [];
  messDataKeys: string[] = [];
  private subs = new SubSink();
  private suppressStatusCardToggle = false;
  plusButtonDisabled: Record<string, boolean> = {};
  isLoading = false;
  isAllSelected = true;
  filteredKeys: string[] = [];
  searchQuery: string = '';
  selectedStatusCardKey: string | null = null;
  query: string = '';
  currentPlusKey: string | null = null;
  keysGroup: any = {};
  sampleValues: Record<string, any> = {};   // stores representative value per key
  constructor(
    private fb: FormBuilder,
    private CrmService: CrmService,
    private _ErrorService: ErrorService,
    private spinnerService: NgxSpinnerService,
    private _toaster: ToasterService,
    public dialog: MatDialog,
    public router: Router,
    // private utilityService: UtilityService,
  ) {
    this.reportEngineForm = this.fb.group({
      rowDataAPI: ['', [Validators.required, Validators.pattern(/^api\/.+$/)]],
      keys: this.fb.group({})
    });
  }

  ngOnInit() {
    // if (this.CrmService.rowDataAPI) {
    this.reportEngineForm.get('rowDataAPI')?.setValue(this.CrmService.rowDataAPI);
    this.loadDataFromAPI(this.CrmService.rowDataAPI); // Load data if rowDataAPI is already set
    // }
    const keysGroup = this.reportEngineForm.get('keys') as FormGroup;

    // Recalculate whenever any checkbox changes
    keysGroup.valueChanges.subscribe(val => {
      this.isAllSelected = this.messDataKeys.every(
        key => val[`${key}_selected`] === true
      );
    });
  }

  toggleSelectAll(event: MatCheckboxChange) {
    this.isAllSelected = event.checked;
    const keysGroup = this.reportEngineForm.get('keys') as FormGroup;
    this.messDataKeys.forEach(key => {
      keysGroup.get(`${key}_selected`)?.setValue(this.isAllSelected);
      // the selected subscriptions will enable/disable controls automatically
    });
  }

  // Extra method in case we want to bind it per-row
  onRowSelectChange() {
    const keysGroup = this.reportEngineForm.get('keys') as FormGroup;
    this.isAllSelected = this.messDataKeys.every(
      key => keysGroup.get(`${key}_selected`)?.value === true
    );
  }

  async loadDataFromAPI(rowDataAPI: string) {
    this.isLoading = true;
    this.spinnerService.show();

    this.subs.add(
      this.CrmService.loadDataFromAPI(rowDataAPI).subscribe(
        (result: any) => {
          if (result['messType'] === 'S') {
            this.messData = result['messData'];
            this.messDataKeys = Object.keys(this.messData[0]);
            this.sampleValues = this.getSampleValuesFromMessData(this.messData);
            console.log('Sample values per key:', this.sampleValues);

            // Create form controls dynamically
            this.keysGroup = {};
            this.messDataKeys.forEach(key => {
              this.keysGroup[`${key}`] = [key];
              this.keysGroup[`${key}_displayName`] = [this.formatFieldName(key)];
              this.keysGroup[`${key}_selected`] = [true]; // default selected true (you can change to false if you prefer)

              this.keysGroup[`${key}_isHide`] = [false]; // NEW: default false
              // selection array and colors map
              this.keysGroup[`${key}_statusCardSelection`] = [[]];
              this.keysGroup[`${key}_statusCardColors`] = [{}]; // <-- store map: { value: '#ee4961', ... }

              this.keysGroup[`${key}_isStatusCard`] = [false];
              this.keysGroup[`${key}_isSlicer`] = [false];
              this.keysGroup[`${key}_isSlicerSort`] = [false];
              this.keysGroup[`${key}_isSlicerType`] = ['set'];
              this.keysGroup[`${key}_isCustomComponent`] = [null];
              this.keysGroup[`${key}_isDateFilter`] = [ false ];
            });

            this.filteredKeys = [...this.messDataKeys]; // Initialize filtered keys
            this.reportEngineForm.setControl('keys', this.fb.group(this.keysGroup));

            // ---------- START: initialize dependent controls & subscribe ----------
            const keysForm = this.reportEngineForm.get('keys') as FormGroup;
            
            this.messDataKeys.forEach(key => {
            const isDateFilterCtl = keysForm.get(`${key}_isDateFilter`);
            if (!isDateFilterCtl) return;

              const sample = this.sampleValues?.[key];
              const canBeDate = this.isIsoDateString(sample); 
              const rowSelected = !!keysForm.get(`${key}_selected`)?.value;
            if (canBeDate && rowSelected) {
              isDateFilterCtl.enable({ emitEvent: false });
            } else {
              isDateFilterCtl.setValue(false, { emitEvent: false });
              isDateFilterCtl.disable({ emitEvent: false });
            }
           });


            // for each key, wire slicer dependent controls and status-card subscribers and "selected" enabling logic
            this.messDataKeys.forEach(key => {
              // dependent control names for slicer
              const dependents = [
                `${key}_isSlicerSort`,
                `${key}_isSlicerType`
              ];

              // --- PRIMARY SELECT control ---
              const selectedCtl = keysForm.get(`${key}_selected`);
              const displayNameCtl = keysForm.get(`${key}_displayName`);
              const statusCtl = keysForm.get(`${key}_isStatusCard`);
              const isSlicerCtl = keysForm.get(`${key}_isSlicer`);
              const isDateFilterCtl = keysForm.get(`${key}_isDateFilter`);
              const statusSelectionCtl = keysForm.get(`${key}_statusCardSelection`);
              const statusColorsCtl = keysForm.get(`${key}_statusCardColors`);
              const isHideCtl = keysForm.get(`${key}_isHide`);
              const IsCustomComponentCtl = keysForm.get(`${key}_isCustomComponent`);


              // ensure these exist
              if (!selectedCtl) return;

              // NEW CODE - replace the old setRowControlsEnabled implementation
              const setRowControlsEnabled = (enabled: boolean) => {
                // Display name editable only when selected
                if (displayNameCtl) {
                  if (enabled) displayNameCtl.enable({ emitEvent: false }); else displayNameCtl.disable({ emitEvent: false });
                }

                // status-card checkbox: only enable it when this row is selected AND
                // either no status card is currently chosen, or this is the chosen key.
                if (statusCtl) {
                  if (enabled) {
                    if (this.selectedStatusCardKey && this.selectedStatusCardKey !== key) {
                      // another key already owns the status-card — keep this one disabled
                      statusCtl.setValue(false, { emitEvent: false });
                      statusCtl.disable({ emitEvent: false });
                    } else {
                      // OK to enable (either no selectedStatusCardKey || this key is the selected one)
                      statusCtl.enable({ emitEvent: false });
                    }
                  } else {
                    // Row being disabled -> if it had the status-card, clear it and re-enable others via handler
                    if (statusCtl.value === true) {
                      this.handleStatusCardToggle(key, false, keysForm);
                      statusSelectionCtl?.setValue([], { emitEvent: false });
                      statusColorsCtl?.setValue({}, { emitEvent: false });
                    }
                    statusCtl.setValue(false, { emitEvent: false });
                    statusCtl.disable({ emitEvent: false });
                  }
                }

                // slicer and its dependents
                if (isSlicerCtl) {
                  if (enabled) {
                    isSlicerCtl.enable({ emitEvent: false });
                    if (isSlicerCtl.value) {
                      dependents.forEach(d => keysForm.get(d)?.enable({ emitEvent: false }));
                    } else {
                      dependents.forEach(d => keysForm.get(d)?.disable({ emitEvent: false }));
                    }
                  } else {
                    isSlicerCtl.setValue(false, { emitEvent: false });
                    isSlicerCtl.disable({ emitEvent: false });
                    dependents.forEach(d => {
                      const c = keysForm.get(d);
                      if (!c) return;
                      if (d.endsWith('_isSlicerType')) {
                        c.setValue('set', { emitEvent: false });
                      } else {
                        c.setValue(false, { emitEvent: false });
                      }
                      c.disable({ emitEvent: false });
                    });
                  }
                }
                

                if (isDateFilterCtl) {
                  const sample = this.sampleValues?.[key];
                  const canBeDate = this.isIsoDateString(sample);
                  if (enabled && canBeDate) {
                    isDateFilterCtl.enable({ emitEvent: false });
                  } else {
                    isDateFilterCtl.setValue(false, { emitEvent: false });
                    isDateFilterCtl.disable({ emitEvent: false });
                  }
                }


                // status selection & colors controls: enable only if selected
                if (statusSelectionCtl) {
                  if (enabled) statusSelectionCtl.enable({ emitEvent: false }); else { statusSelectionCtl.setValue([], { emitEvent: false }); statusSelectionCtl.disable({ emitEvent: false }); }
                }
                if (statusColorsCtl) {
                  if (enabled) statusColorsCtl.enable({ emitEvent: false }); else { statusColorsCtl.setValue({}, { emitEvent: false }); statusColorsCtl.disable({ emitEvent: false }); }
                }

                // NEW: isHide follows row selection enabled state
                if (isHideCtl) {
                  if (enabled) isHideCtl.enable({ emitEvent: false }); else { isHideCtl.setValue(false, { emitEvent: false }); isHideCtl.disable({ emitEvent: false }); }
                }
                // NEW: isHide follows row selection enabled state
                if (IsCustomComponentCtl) {
                  if (enabled) {
                    IsCustomComponentCtl.enable({ emitEvent: false });
                  } else {
                    IsCustomComponentCtl.setValue(null, { emitEvent: false }); // clear custom component when disabled
                    IsCustomComponentCtl.disable({ emitEvent: false });
                  }
                }

                // ALSO update the plus-button disabled map so template can use it
                // (do this AFTER IsCustomComponentCtl logic so map always reflects final state)
                this.plusButtonDisabled[key] = !enabled;
              };


              // initialize row enabled state based on initial selected value
              setRowControlsEnabled(!!selectedCtl.value);

              // subscribe to selected changes so that when user toggles the primary checkbox, everything else toggles
              const subSelected = selectedCtl.valueChanges.subscribe((sel: boolean) => {
                setRowControlsEnabled(!!sel);
              });
              this.subs.add(subSelected);

              // ----- handle isSlicer initial state & subscription -----
              if (isSlicerCtl) {
                // If disabled by selection logic above, it will already be disabled.
                if (isSlicerCtl.enabled && !isSlicerCtl.value) {
                  dependents.forEach(d => {
                    const c = keysForm.get(d);
                    if (!c) return;
                    if (d.endsWith('_isSlicerType')) {
                      c.setValue('set', { emitEvent: false });
                    } else {
                      c.setValue(false, { emitEvent: false });
                    }
                    c.disable({ emitEvent: false });
                  });
                }

                const subSlicer = isSlicerCtl.valueChanges.subscribe((v: boolean) => {
                  // only act if row is selected (controls should be enabled)
                  if (!selectedCtl.value) {
                    // ensure dependents remain disabled when row not selected
                    dependents.forEach(d => keysForm.get(d)?.disable({ emitEvent: false }));
                    return;
                  }

                  if (v) {
                    dependents.forEach(d => keysForm.get(d)?.enable({ emitEvent: false }));
                  } else {
                    dependents.forEach(d => {
                      const c = keysForm.get(d);
                      if (!c) return;
                      if (d.endsWith('_isSlicerType')) {
                        c.setValue('set', { emitEvent: false });
                      } else {
                        c.setValue(false, { emitEvent: false });
                      }
                      c.disable({ emitEvent: false });
                    });
                  }
                });
                this.subs.add(subSlicer);
              }

              // ----- wire status-card single-select enforcement -----
              if (statusCtl) {
                // if any control is already true initially, enforce the rule
                if (statusCtl.value === true) {
                  this.handleStatusCardToggle(key, true, keysForm);
                }

                const subStatus = statusCtl.valueChanges.subscribe((checked: boolean) => {
                  // honor suppress flag: when true we ignore value changes (dialog flow manages state)
                  if (this.suppressStatusCardToggle) return;

                  // Prevent status-card toggling when row is not selected
                  if (!selectedCtl.value && checked) {
                    // if user somehow tries to check it (control should be disabled) — reset it
                    statusCtl.setValue(false, { emitEvent: false });
                    return;
                  }

                  this.handleStatusCardToggle(key, checked, keysForm);
                });
                this.subs.add(subStatus);
              }
            });
            // ---------- END ----------

            this.isLoading = false;
            this.spinnerService.hide();
          } else {
            this.isLoading = false;
            this.spinnerService.hide();
            console.error('No data found:', result['messText']);
          }
        },
        err => {
          this.isLoading = false;
          this._ErrorService.userErrorAlert(
            err.error.code,
            'Some Error Happened in completing the Activity',
            err.error.errMessage
          );
        }
      )
    );
  }

  drop(event: CdkDragDrop<string[]>) {
    // reorder the visible list (filteredKeys)
    moveItemInArray(this.filteredKeys, event.previousIndex, event.currentIndex);

    const keysForm = this.reportEngineForm.get('keys') as FormGroup;

    // list of suffixes you keep for each key
    const suffixes = [
      '',                         // empty for base key (e.g. 'v')
      '_displayName',
      '_selected',
      '_isHide',                  // NEW: keep this in ordering
      '_isStatusCard',
      '_isSlicer',
      '_isDateFilter',
      '_isSlicerSort',
      '_isSlicerType',
      '_statusCardSelection',
      '_statusCardColors',
      '_isCustomComponent'      // NEW: keep this in ordering
    ];

    // create a fresh group and register existing controls into it (preserves state & subs)
    const newGroup = this.fb.group({});

    this.filteredKeys.forEach(key => {
      suffixes.forEach(suffix => {
        const ctrlName = suffix === '' ? key : key + suffix;
        const existing = keysForm.get(ctrlName);

        if (existing) {
          // move the same control instance into the new group
          newGroup.registerControl(ctrlName, existing);
        } else {
          // control missing (shouldn't normally happen) -> create fallback control with sensible default
          const defaultValue = (suffix === '_isSlicerType') ? 'set' : (suffix === '_displayName' ? this.formatFieldName(key) : (suffix === '' ? key : false));
          newGroup.addControl(ctrlName, this.fb.control(defaultValue));
        }
      });
    });

    // replace the 'keys' FormGroup with the reordered one
    this.reportEngineForm.setControl('keys', newGroup);

    // keep master list in sync
    this.messDataKeys = [...this.filteredKeys];
  }


  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  formatFieldName(field: string): string {
    return field
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  async onStatusCardChange(event: MatCheckboxChange, key: string) {
    const keysForm = this.reportEngineForm.get('keys') as FormGroup;
    const ctl = keysForm.get(`${key}_isStatusCard`);

    // If user UNCHECKED -> behave normally and clear selection
    if (!event.checked) {
      // allow normal subscription handling for this user action
      this.handleStatusCardToggle(key, false, keysForm);
      keysForm.get(`${key}_statusCardSelection`)?.setValue([], { emitEvent: false });
      return;
    }

    // USER CHECKED: begin dialog flow
    // 1) suppress automatic subscription reactions while we handle dialog
    this.suppressStatusCardToggle = true;

    // 2) immediately reset all status-card controls to enabled & false so no transient disabling remains
    // NEW CODE - only enable status-card controls for rows that are currently selected
    this.messDataKeys.forEach(k => {
      const c = keysForm.get(`${k}_isStatusCard`);
      if (!c) return;
      const rowSelected = !!keysForm.get(`${k}_selected`)?.value;
      if (rowSelected) {
        c.enable({ emitEvent: false });
        c.setValue(false, { emitEvent: false });
      } else {
        // keep disabled for unselected rows
        c.setValue(false, { emitEvent: false });
        c.disable({ emitEvent: false });
      }
    });


    // 3) gather unique values from this.messData for the clicked key
    const values = Array.from(
      new Set(
        (this.messData || []).map((r: any) => r[key]).filter((v: any) => v !== null && v !== undefined && v !== '')
      )
    );

    const preselected = keysForm.get(`${key}_statusCardSelection`)?.value ?? [];

    // 4) open dialog
    const dialogRef = this.dialog.open(StatusCardDialogComponent, {
      width: '520px',
      data: {
        key,
        values,
        selected: Array.isArray(preselected) ? preselected : []
      }
    });

    // 5) handle result
    dialogRef.afterClosed().subscribe(async (res: { confirmed?: boolean; selected?: any[]; colors?: Record<string, string> } | undefined) => {
      this.suppressStatusCardToggle = false;

      // NEW CODE - restore state for only selected rows; keep others disabled
      if (!res || res.confirmed !== true) {
        this.messDataKeys.forEach(k => {
          const c = keysForm.get(`${k}_isStatusCard`);
          if (!c) return;
          const rowSelected = !!keysForm.get(`${k}_selected`)?.value;
          if (rowSelected) {
            c.enable({ emitEvent: false });
            c.setValue(false, { emitEvent: false });
          } else {
            c.setValue(false, { emitEvent: false });
            c.disable({ emitEvent: false });
          }
        });
        return;
      }


      const selectedArray = Array.isArray(res.selected) ? res.selected : [];
      keysForm.get(`${key}_statusCardSelection`)?.setValue(selectedArray, { emitEvent: false });

      // store colors map if provided
      if (res.colors && typeof res.colors === 'object') {
        keysForm.get(`${key}_statusCardColors`)?.setValue(res.colors, { emitEvent: false });
      } else {
        // if no colors returned, ensure it's cleared
        keysForm.get(`${key}_statusCardColors`)?.setValue({}, { emitEvent: false });
      }

      // now delegate to handler which will set this one true and disable others
      this.handleStatusCardToggle(key, true, keysForm);
      this._toaster.showInfo(`Status card for "${key}" set (${selectedArray.length} values)`, `done`, 10000);

    // let confirmation = await this.confirmSweetAlert('Add Custom Component?', 'Do you want to display these values as coloured label with the selected colours?');
    // if (confirmation.value) {
    //   this.selectCustomComponentForKey(key!, 'label');
    // }
    });

  }

  onSearch(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value.toLowerCase().trim();
    console.log('Search input:', inputValue);
    this.query = inputValue;

    if (!inputValue) {
      this.filteredKeys = [...this.messDataKeys];
      return;
    }
    console.log("Filtering keys based on input:", this.messDataKeys);
    // Filter keys based on whether any row’s value for that key contains the search query
    this.filteredKeys = this.messDataKeys.filter(key =>
      key.toLowerCase().includes(inputValue)
    );
    console.log("Filtered keys:", this.filteredKeys);
  }
  // --- add this helper in the component class ---
  private handleStatusCardToggle(key: string, checked: boolean, keysForm: FormGroup) {
    if (checked) {
      // make this the single selected status card and disable others
      this.selectedStatusCardKey = key;
      this.messDataKeys.forEach(k => {
        const ctl = keysForm.get(`${k}_isStatusCard`);
        if (!ctl) return;
        if (k === key) {
          ctl.enable({ emitEvent: false });
          ctl.setValue(true, { emitEvent: false });
        } else {
          ctl.setValue(false, { emitEvent: false });
          ctl.disable({ emitEvent: false });
        }
      });
    } else {
      // if user unchecked the currently selected one -> clear selection and re-enable all
      if (this.selectedStatusCardKey === key) {
        this.selectedStatusCardKey = null;
        this.messDataKeys.forEach(k => {
          const ctl = keysForm.get(`${k}_isStatusCard`);
          if (!ctl) return;
          const rowSelected = !!keysForm.get(`${k}_selected`)?.value;
          if (rowSelected) {
            ctl.enable({ emitEvent: false });
          } else {
            ctl.setValue(false, { emitEvent: false });
            ctl.disable({ emitEvent: false });
          }
        });
      } else {
        // ensure it stays false
        keysForm.get(`${key}_isStatusCard`)?.setValue(false, { emitEvent: false });
      }
    }
  }
  private groupedKeysFromFlat(flat: Record<string, any>) {
    const grouped: Record<string, any> = {};
    // iterate keys like 'v_displayName', 'v_selected', or base 'v'
    Object.keys(flat).forEach(flatKey => {
      // find prefix: take substring until first '_' if there is one, else prefix is flatKey itself
      const idx = flatKey.indexOf('_');
      const prefix = idx === -1 ? flatKey : flatKey.slice(0, idx);

      // ensure object for this prefix
      if (!grouped[prefix]) grouped[prefix] = {};

      // if flatKey is the base key (exact match), you might want to set grouped[prefix].key = flat[prefix]
      if (flatKey === prefix) {
        grouped[prefix].key = flat[flatKey];   // e.g. grouped['v'].key = 'v'
      } else {
        // keep the original flat property name inside the group's object,
        // or strip the prefix if you prefer grouped['v'].displayName = value
        grouped[prefix][flatKey] = flat[flatKey];
      }
    });

    return grouped;
  }

    async createReport() {
      const confirmation = await Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to create this report with these configurations?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, create it!',
        cancelButtonText: 'Cancel',
        background: '#fff',
        backdrop: 'rgba(0,0,0,0.7)', // translucent background
      });

      if (confirmation.isConfirmed) {
        const keysForm = this.reportEngineForm.get('keys') as FormGroup;
        const flat = keysForm.getRawValue();

        const colDefs = await this.buildColDefsFromFlat(flat);
        const statusCardConfigs = this.extractStatusCardConfigsFromFlat(flat);
        const slicer_config = this.buildSlicerConfigFromFlat(flat);
        const dateFilterCfg = this.buildDateFilterConfigFromFlat(flat);

        const report = { colDefs, statusCardConfigs, slicer_config };
      // generate reportKey
        const reportKey = this.CrmService.reportName
          .trim()                       // remove leading/trailing spaces
          .toLowerCase()                // convert to lowercase
          .replace(/\s+/g, '-')         // replace spaces with hyphen
          .replace(/[^\w-]/g, '');      // remove any non-word characters except hyphen

        console.log(reportKey); // "opportunities-report"

        const reportConfig = {
          report_name: this.CrmService.reportName, // "Opportunities Report"
          label: reportKey,                  // "opportunities-report"
          rowDataAPI: this.reportEngineForm.get('rowDataAPI')?.value,
          colDefs: report.colDefs,
          slicer_config: report.slicer_config,
          statusCardConfigs: report.statusCardConfigs,
          isDateFilter: dateFilterCfg.isDateFilter,
          dateFilterColumns: dateFilterCfg.dateFilterColumns
        };

        const reportService = {
          label:reportKey,
          report_name: this.CrmService.reportName,
          report_config: reportConfig,
        }

        this.CrmService.createReport(reportConfig).subscribe((result: any) => {
          console.log('Report created successfully:', result);
          this.CrmService.selectedReport = reportService;
          // ✅ SweetAlert2 success popup
          Swal.fire({
            title: 'Report Created Successfully!',
            text: 'Your report has been created successfully.',
            icon: 'success', // built-in animated tick
            showCancelButton: true,
            confirmButtonText: 'View Report',
            cancelButtonText: 'Create Another Report',
            reverseButtons: true,
            background: '#fff',
            backdrop: `
              rgba(0,0,0,0.7)
              left top
              no-repeat
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then(result => {
            if (result.isConfirmed) {
              // 🔹 View the created report
              this.router.navigateByUrl(`main/reportV2/${reportKey}`);
            } else if (result.dismiss === Swal.DismissReason.cancel) {
              // 🔹 Create another report
              // this.router.navigate(['/report-creation']);
                 this.router.navigateByUrl(`main/crmreportengine`);
            }
          });
        });
      }
    }



  getWfhSweetAlertTemplate = (title, text) => {
    let wfhTemplate = {
      customClass: {
        title: "title-class",
        confirmButton: "confirm-button-class",
        cancelButton: "confirm-button-class"
      },
      title: title,
      text: text,
      type: "warning",
      showConfirmButton: true,
      showCancelButton: true
    }

    return wfhTemplate;
  }

  confirmSweetAlert(title, text) {
    let template = this.getWfhSweetAlertTemplate(title, text);
    return sweetAlert.fire(template)
  }
  buildSlicerConfigFromFlat(flat: Record<string, any>) {
    const slicerConfig: Array<{
      field: string;
      sort: boolean;
      title: string;
      type: string;
    }> = [];

    Object.keys(flat).forEach(key => {
      if (!key.endsWith('_isSlicer')) return;
      const isSlicer = !!flat[key];
      if (!isSlicer) return;

      const base = key.slice(0, -'_isSlicer'.length);

      slicerConfig.push({
        field: base,
        sort: !!flat[`${base}_isSlicerSort`],
        title: flat[`${base}_displayName`] ?? base,
        type: flat[`${base}_isSlicerType`] ?? 'set'
      });
    });

    return slicerConfig;
  }

  async buildColDefsFromFlat(flat: Record<string, any>): Promise<ColDef[]> {
    const seen = new Set<string>();
    const colDefs: ColDef[] = [];

    for (const prop of Object.keys(flat)) {
      if (!prop.endsWith('_selected')) continue;

      const baseKey = prop.replace(/_selected$/, '');
      if (seen.has(baseKey)) continue;

      const isSelected = !!flat[prop];
      const isHidden = !!flat[`${baseKey}_isHide`];

      // Skip unless selected
      if (!isSelected) continue;

      seen.add(baseKey);

      const headerName = flat[`${baseKey}_displayName`] ?? baseKey;
      const slicerType = flat[`${baseKey}_isSlicerType`];

      const filter =
        slicerType === 'set' ? 'agSetColumnFilter'
          : slicerType === 'text' ? 'agTextColumnFilter'
            : 'agTextColumnFilter';

      const col: ColDef = {
        field: baseKey,
        headerName,
        resizable: true,
        flex: 1,      // distributes remaining width evenly
        minWidth: 200,
        filter,
        sortable: true
      };

      if (isHidden) (col as any).hide = true;

      // === attach custom component metadata + renderer for 'curr' ===
      const customType = flat[`${baseKey}_isCustomComponent`];
      if (customType) {
        // const meta: any = { type: customType };
        if (customType === 'curr') {
          // meta.currency = (flat[`${baseKey}_customCurrency`] ?? 'usd').toLowerCase();
          // meta.sample = flat[`${baseKey}_customComponentValue`] ?? null;
          (col as any).customComponent = customType;

          // // attach the Angular renderer component (ensure it's imported & added to @Component imports)
          // (col as any).cellRendererFramework = SharedCustomComponent;

          // // valueGetter: parse JSON stored in row's baseKey field and pick matching currency value
          // // closure captures `baseKey` and `flat` so it will use the currency selected at report-creation time
          // (col as any).valueGetter = (params: any) => {
          //   try {
          //     const raw = params?.data?.[baseKey];
          //     if (raw == null) return null;

          //     // raw may already be an object/array or may be a JSON string
          //     let values: { value: number; currency_code: string }[] = [];
          //     if (typeof raw === 'string') {
          //       values = JSON.parse(raw);
          //     } else if (Array.isArray(raw)) {
          //       values = raw;
          //     } else {
          //       // unexpected shape
          //       return null;
          //     }

          //     const wantedCurrency = (flat[`${baseKey}_customCurrency`] ?? 'usd').toLowerCase();
          //     const match = values.find(v => String(v.currency_code).toLowerCase() === wantedCurrency);
          //     return match?.value ?? null;
          //   } catch {
          //     return null;
          //   }
          // };

          // pass currency getter to renderer (renderer can call currency_code() to get current chosen currency)
          // (col as any).cellRendererParams = {
          //   field: baseKey,
          //   currency: meta.currency
          // };

          // valueFormatter as requested
          // (col as any).valueFormatter = (params: any) => params?.value ?? '-';
        } else if (customType === 'image') {
          // meta.sample = flat[`${baseKey}_customComponentValue`] ?? null;
          (col as any).customComponent = customType;
          // intentionally do NOT attach currency renderer for 'image'
        }
      }
      // === end custom component ===

      colDefs.push(col);
    }

    return Promise.resolve(colDefs);
  }



  private extractStatusCardConfigsFromFlat(flat: Record<string, any>) {
    if (!flat || typeof flat !== 'object') return [];

    return Object.keys(flat)
      .filter(k => k.endsWith('_statusCardColors'))
      .map(colorsKey => {
        const baseKey = colorsKey.replace(/_statusCardColors$/, '');
        const colorsObj = flat[colorsKey] || {};
        // skip empty objects
        const colorKeys = Object.keys(colorsObj || {});
        if (colorKeys.length === 0) return null;

        // try to get corresponding selection array if present
        const selectionKey = `${baseKey}_statusCardSelection`;
        const selectionArr = Array.isArray(flat[selectionKey]) ? flat[selectionKey].map(String) : [];

        const card_config = colorKeys.map(val => ({
          value: String(val),
          color: String(colorsObj[val]),
          selected: selectionArr.includes(String(val))
        }));

        return { key: baseKey, card_config };
      })
      .filter(Boolean) as Array<{ key: string; card_config: Array<{ value: string; color: string; selected: boolean }> }>;
  }
  // return the FormControl instance (or null)
  getCustomComponentControl(key: string): FormControl | null {
    const keysForm = this.reportEngineForm.get('keys') as FormGroup | null;
    if (!keysForm) return null;
    return keysForm.get(`${key}_isCustomComponent`) as FormControl | null;
  }

  // return just the value (handy if you prefer using value directly)
  getCustomComponentvalue(key: string): any {
    return this.getCustomComponentControl(key)?.value ?? null;
  }

  toggleCustomComponentValue(key: string, value: string, event?: MouseEvent): void {
    const control = this.getCustomComponentControl(key);
    if (!control) return;
    // toggle selection
    control.setValue(control.value === value ? null : value, { emitEvent: true });
    // prevent menu/parent click propagation if caller passed event
    if (event) event.stopPropagation();
  }

  setCurrentPlusKey(key: string) {
    this.currentPlusKey = key;
  }

  // ---------- Helpers ----------

  /** returns true if v is an array of { value: number|numeric-string, currency_code: string } */
  private isCurrencyArray(v: any): boolean {
    if (!Array.isArray(v) || v.length === 0) return false;

    return v.every(item => {
      if (!item || typeof item !== 'object') return false;
      const hasCurrency = typeof item.currency_code === 'string' && item.currency_code.trim().length > 0;
      const val = item.value;
      const isNumber = typeof val === 'number' && !isNaN(val);
      const isNumericString = typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val));
      return hasCurrency && (isNumber || isNumericString);
    });
  }

  /** normalize currency array: parse numeric-strings to numbers and trim codes */
  private normalizeCurrencyArray(raw: any): Array<{ value: number; currency_code: string }> {
    if (!Array.isArray(raw)) return [];
    return raw.map(item => ({
      value: (typeof item.value === 'number' && !isNaN(item.value)) ? item.value : Number(item.value),
      currency_code: String(item.currency_code ?? '').trim()
    }));
  }

  /** returns true if v is string-like image value (string or array-of-strings or object with url-like props) */
  private isImageValue(v: any): boolean {
    if (v === null || v === undefined) return false;

    // direct string
    if (typeof v === 'string') {
      return v.trim().length > 0;
    }

    // array containing at least one non-empty string
    if (Array.isArray(v)) {
      return v.some(el => typeof el === 'string' && el.trim().length > 0);
    }

    // object with likely url fields
    if (typeof v === 'object') {
      const urlKeys = ['url', 'src', 'image', 'path', 'link', 'uri'];
      for (const k of urlKeys) {
        if (typeof v[k] === 'string' && v[k].trim().length > 0) return true;
      }
    }

    return false;
  }
private isIsoDateString(v: any): boolean {
  if (typeof v !== 'string') return false;
  
  const trimmed = v.trim();
  
  // Handle ISODate("...") wrapper format from MongoDB
  let dateStr = trimmed;
  const isoDateMatch = trimmed.match(/^ISODate\("(.+)"\)$/);
  if (isoDateMatch) {
    dateStr = isoDateMatch[1];
  }
  
  // Handle new Date("...") wrapper format
  const newDateMatch = trimmed.match(/^new Date\("(.+)"\)$/);
  if (newDateMatch) {
    dateStr = newDateMatch[1];
  }
  
  // Date format patterns (ordered from most specific to least specific)
  const datePatterns = [
    // ISO 8601 with timezone offset: YYYY-MM-DDTHH:MM:SS+05:30 or YYYY-MM-DDTHH:MM:SS-05:00
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
    
    // ISO 8601 with milliseconds and Z: YYYY-MM-DDTHH:MM:SS.SSSZ
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    
    // ISO 8601 with milliseconds (no Z): YYYY-MM-DDTHH:MM:SS.SSS
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/,
    
    // ISO 8601 with Z: YYYY-MM-DDTHH:MM:SSZ
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
    
    // ISO 8601 without Z: YYYY-MM-DDTHH:MM:SS
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
    
    // SQL datetime with milliseconds: YYYY-MM-DD HH:MM:SS.SSS
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\d{3}$/,
    
    // SQL datetime: YYYY-MM-DD HH:MM:SS
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    
    // Date only: YYYY-MM-DD
    /^\d{4}-\d{2}-\d{2}$/
  ];
  
  // Test against all patterns
  return datePatterns.some(pattern => pattern.test(dateStr));
}
  private buildDateFilterConfigFromFlat(flat: Record<string, any>) {
    if (!flat || typeof flat !== 'object') {
      return { isDateFilter: false, dateFilterColumns: [] };
    }

    const dateFilterColumns = Object.keys(flat)
      .filter(k => k.endsWith('_isDateFilter') && !!flat[k])
      .map(k => k.replace(/_isDateFilter$/, ''));

    return {
      isDateFilter: dateFilterColumns.length > 0,
      dateFilterColumns
    };
  }

  /** normalize image value: return string (trimmed), array of trimmed strings, or deep-cloned object */
  private normalizeImageValue(raw: any): string | string[] | object {
    if (typeof raw === 'string') return raw.trim();

    if (Array.isArray(raw)) {
      const list = raw.filter(el => typeof el === 'string' && el.trim().length > 0).map((s: string) => s.trim());
      return list;
    }

    if (typeof raw === 'object') {
      // if object has url-like keys, prefer that string
      const urlKeys = ['url', 'src', 'image', 'path', 'link', 'uri'];
      for (const k of urlKeys) {
        if (typeof raw[k] === 'string' && raw[k].trim().length > 0) return { [k]: raw[k].trim(), ...this.deepClone(raw) };
      }
      // otherwise return deep clone of object
      return this.deepClone(raw);
    }

    // fallback: convert to string
    return String(raw);
  }

  // Replace existing selectCustomComponentForKey with this version
  selectCustomComponentForKey(key: string, value: 'curr' | 'image' | 'label') {
    const keysForm = this.reportEngineForm.get('keys') as FormGroup;
    if (!keysForm) return;

    // Ensure sampleValues exists
    const sample = (this as any).sampleValues?.[key];

    // --- if user picked 'curr' we must validate AND ensure only this row has 'curr' ---
  // inside selectCustomComponentForKey(...)
if (value === 'curr') {
  if (!this.isCurrencyArray(sample)) {
    this._toaster?.showInfo(
      `Cannot set Currency for "${key}". Expected an array like [{ value: number, currency_code: "USD" }, ...].`,
      'Invalid sample',
      5000
    );
    return;
  }

  // Passed validation: normalize and store into custom value control for THIS row
  const normalized = this.normalizeCurrencyArray(sample);
  const customValControlName = `${key}_customComponentValue`;
  if (keysForm.get(customValControlName)) {
    keysForm.get(customValControlName)?.setValue(normalized, { emitEvent: false });
  } else {
    keysForm.addControl(customValControlName, this.fb.control(normalized));
  }

  // add/create the per-row currency radio control
  const currencyControlName = `${key}_customCurrency`;
  const inferred = (Array.isArray(normalized) && normalized.length > 0 && normalized[0].currency_code)
    ? String(normalized[0].currency_code).toLowerCase()
    : 'usd';
  const defaultCurrency = (inferred === 'inr' ? 'inr' : 'usd');

  if (keysForm.get(currencyControlName)) {
    keysForm.get(currencyControlName)?.setValue(defaultCurrency, { emitEvent: false });
  } else {
    keysForm.addControl(currencyControlName, this.fb.control(defaultCurrency));
  }
}


    // --- if user picked 'image' ---
    if (value === 'image') {
      // ✅ Step 1: upfront validation
      if (!this.isImageValue(sample)) {
        this._toaster?.showInfo(
          `Cannot set User Image for "${key}". Expected a string or an object/array containing image URL(s).`,
          'Invalid sample',
          5000
        );
        return;
      }

      // ✅ Step 2: ask user confirmation only if sample passes
      Swal.fire({
        title: "↑ Expected Usage",
        html: `
      <p>This component displays both <b>image + name</b> of the user.</p>
      <p style="color:#ee4961; font-size:15px;margin-bottom:9px;">
        Select only <b>OID</b> in column selection.
      </p>
      <p style="color:#ee4961; font-size:15px;margin-bottom:-4px">
        Avoid selecting name column of the same field.
      </p>
    `,
        imageUrl: "https://assets.kaartech.com/User profile example.png",
        imageWidth: 303,
        imageHeight: 86,
        imageAlt: "Custom image",
        showCancelButton: false,
        confirmButtonColor: "#3085d6",
        confirmButtonText: "I Understand"
      }).then((result) => {
        if (result.isConfirmed) {
          // ✅ passed both validation + user confirmation
          const normalizedImage = this.normalizeImageValue(sample);
          const customValControlName = `${key}_customComponentValue`;

          if (keysForm.get(customValControlName)) {
            keysForm.get(customValControlName)?.setValue(normalizedImage, { emitEvent: false });
          } else {
            keysForm.addControl(customValControlName, this.fb.control(normalizedImage));
          }

          // remove currency control for this row if present
          const currencyControlNameToRemove = `${key}_customCurrency`;
          if (keysForm.get(currencyControlNameToRemove)) {
            keysForm.removeControl(currencyControlNameToRemove);
          }
        } else if (result.isDismissed) {
          this._toaster?.showInfo(
            `Cannot set User Image for "${key}". User Dismissed.`,
            'Dismissed',
            5000
          );
          return;
        }
      });
    }

    // // --- if user picked 'label' ---
    // if (value === 'label') {
    //   // ✅ Step 1: upfront validation
    //   if (!this.isImageValue(sample)) {
    //     this._toaster?.showInfo(
    //       `Cannot set Label for "${key}". Expected a string .`,
    //       'Invalid sample',
    //       5000
    //     );
    //     return;
    //   }

    //   // ✅ Step 2: ask user confirmation only if sample passes
    //   Swal.fire({
    //     title: "↑ Expected Usage",
    //     html: `<p style="margin: -6px;padding: 0;">This component displays the value in a coloured label.</p>`,
    //     imageUrl: "https://assets.kaartech.com/coloured_label_re.png",
    //     imageWidth: 202,
    //     imageHeight: 137,
    //     imageAlt: "Custom label",
    //     showCancelButton: false,
    //     confirmButtonColor: "#3085d6",
    //     confirmButtonText: "I Understand"
    //   }).then((result) => {
    //     if (result.isConfirmed) {
    //       // ✅ passed both validation + user confirmation
    //       const normalizedImage = this.normalizeImageValue(sample);
    //       const customValControlName = `${key}_customComponentValue`;

    //       if (keysForm.get(customValControlName)) {
    //         keysForm.get(customValControlName)?.setValue(normalizedImage, { emitEvent: false });
    //       } else {
    //         keysForm.addControl(customValControlName, this.fb.control(normalizedImage));
    //       }

    //       // remove currency control for this row if present
    //       const currencyControlNameToRemove = `${key}_customCurrency`;
    //       if (keysForm.get(currencyControlNameToRemove)) {
    //         keysForm.removeControl(currencyControlNameToRemove);
    //       }
    //     } else if (result.isDismissed) {
    //       this._toaster?.showInfo(
    //         `Cannot set User Image for "${key}". User Dismissed.`,
    //         'Dismissed',
    //         5000
    //       );
    //       return;
    //     }
    //   });
    // }

    // Finally set the marker control for this row
    const control = keysForm.get(`${key}_isCustomComponent`) as FormControl | null;
    if (control) {
      control.setValue(value, { emitEvent: true });
    } else {
      keysForm.addControl(`${key}_isCustomComponent`, this.fb.control(value));
    }
  }



  // Replace removeCustomComponentForKey with this version
  removeCustomComponentForKey(key: string) {
    const keysForm = this.reportEngineForm.get('keys') as FormGroup | null;
    const control = this.getCustomComponentControl(key);
    control?.setValue(null, { emitEvent: true });

    if (keysForm) {
      const customValControlName = `${key}_customComponentValue`;
      if (keysForm.get(customValControlName)) keysForm.removeControl(customValControlName);

      const currencyControlName = `${key}_customCurrency`;
      if (keysForm.get(currencyControlName)) keysForm.removeControl(currencyControlName);
    }
  }

  // --------- config: which string tokens count as "empty" ----------
  private readonly EMPTY_PLACEHOLDERS = new Set<string>([
    '(null)', 'null', 'n/a', '-', 'na', 'none', 'not available', ''
  ]);

  // --------- helper utilities ----------
  private isPrimitive(val: any): boolean {
    return val === null || (typeof val !== 'object' && typeof val !== 'function');
  }

  public hasSampleValue(key: string): boolean {
    const v = this.sampleValues?.[key];
    return v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === '');
  }

  public isRowSelected(key: string): boolean {
    const keysForm = this.reportEngineForm.get('keys') as FormGroup | null;
    return !!keysForm?.get(`${key}_selected`)?.value;
  }
  private deepClone<T>(obj: T): T {
    try {
      // @ts-ignore - structuredClone exists in modern environments
      if (typeof structuredClone === 'function') return structuredClone(obj);
    } catch { }
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      return obj as T;
    }
  }

  /**
   * Treats empty/null-like values and placeholder tokens as "empty".
   */
  private isEmptyValue(v: any): boolean {
    if (v === null || v === undefined) return true;

    // Strings: trim and test for placeholder tokens
    if (typeof v === 'string') {
      const t = v.trim();
      if (t === '') return true;
      if (this.EMPTY_PLACEHOLDERS.has(t.toLowerCase())) return true;
      return false;
    }

    // Arrays: empty => empty, otherwise not empty
    if (Array.isArray(v)) return v.length === 0;

    // Objects: treat empty object as empty
    if (typeof v === 'object') return Object.keys(v).length === 0;

    // numbers/booleans => not empty
    return false;
  }

  // --------- main function (returns one representative per key; preserves arrays/objects) ----------
  private getSampleValuesFromMessData(messData: any[]): Record<string, any> {
    const sample: Record<string, any> = {};
    if (!Array.isArray(messData) || messData.length === 0) return sample;

    // choose keys from first row; change this if you prefer union of all keys
    const keys = Object.keys(messData[0] || {});

    for (const key of keys) {
      let found: any = undefined;

      for (let i = 0; i < messData.length; i++) {
        const raw = messData[i]?.[key];

        if (this.isEmptyValue(raw)) continue; // skip null/placeholder/empty

        // arrays
        if (Array.isArray(raw)) {
          if (raw.length === 0) continue;
          const first = raw[0];
          if (first === null || first === undefined) {
            // try to find a non-empty element inside the array
            const usable = raw.find(el => !this.isEmptyValue(el));
            if (!usable) continue;
            if (this.isPrimitive(usable)) {
              found = usable;
            } else {
              found = this.deepClone(raw); // preserve full array of objects
            }
          } else {
            if (this.isPrimitive(first)) {
              found = first; // primitive array -> first primitive
            } else {
              found = this.deepClone(raw); // object array -> whole array
            }
          }
        }
        // objects (preserve full structure)
        else if (typeof raw === 'object') {
          found = this.deepClone(raw);
        }
        // strings (trimmed)
        else if (typeof raw === 'string') {
          found = raw.trim();
        }
        // primitives (number/boolean)
        else {
          found = raw;
        }

        // stop scanning rows for this key once we found something usable
        break;
      }

      sample[key] = found !== undefined ? found : null;
    }

    return sample;
  }

  // ----- tooltip formatting -----
  // returns a short, readable string for the tooltip (preserves objects/arrays via JSON, truncated)
  public getTooltipText(key: string): string {
    if (!this.sampleValues) return '';
    const val = this.sampleValues[key];

    if (val === null || val === undefined) return '';

    // primitive -> simple string
    if (this.isPrimitive(val)) {
      // trim strings and return numbers/booleans as-is
      return typeof val === 'string' ? val.trim() : String(val);
    }

    // For arrays / objects -> pretty-print JSON but keep tooltip short
    try {
      const json = JSON.stringify(val, null, 2);
      // replace long line breaks with single spaces for compact tooltip, keep formatting if short
      const cleaned = json.length > 200 ? json.replace(/\s+/g, ' ') : json;
      return this.truncateTooltip(cleaned, 600);
    } catch (e) {
      // fallback
      return String(val);
    }
  }

  private truncateTooltip(text: string, maxLen = 600): string {
    if (!text) return text;
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen - 3) + '...';
  }
  // (add or replace this getter)
  public get showCustomComponentHeader(): boolean {
    const keysForm = this.reportEngineForm.get('keys') as FormGroup | null;
    if (!keysForm) return false;
    return this.messDataKeys.some(k => keysForm.get(`${k}_isCustomComponent`)?.value === 'curr');
  }


}
