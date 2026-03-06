import { Component, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { ColDef, GridApi, GridReadyEvent, IServerSideGetRowsParams, SideBarDef } from 'ag-grid-community';
// import { ToasterService } from '../../../../../../../shared-lib/src/lib/services/shared/toaster-service/toaster.service';
// import { SubSink } from 'subsink';
// import { CrmService } from '../../services/crm.service';

// import { AppSharedComponentsService } from '../../../../../../../../../newWebApplication/src/app/app-shared/services/app-shared-components.service';

@Component({
  selector: 'app-shared-report',
  templateUrl: './shared-report.component.html',
  styleUrls: ['./shared-report.component.scss']
})
export class SharedReportComponent{
//   reportConfig: any = null;
//   routeParam: string | null = null;
//   data: any = {};
//   private subs = new SubSink();
//   rowData: any = [];
//   application_id: any;
//   gridApi: GridApi | undefined;
//   query: string;
//   statusItems: any[] = [];
//   filterModel: any = {};
//   columnApi: any;
//   summaryKey: any;

//   constructor(private route: ActivatedRoute, private router: Router,
//     private CrmService: CrmService,
//     private _toaster: ToasterService,
//     private AppSharedComponentsService: AppSharedComponentsService) { }

//   ngOnInit(): void {
//     this.data = {
//       "report_name": "Opportunity Report",
//       "rowDataAPI": "api/opportunitiesV2/getOpportunitiesList",
//       "colDefs": [
//         {
//           "field": "opportunity_id",
//           "headerName": "Opportunity Id",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true
//         },
//         {
//           "field": "sbu",
//           "headerName": "Sbu",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "bu",
//           "headerName": "Bu",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "opportunity_name",
//           "headerName": "Opportunity Name",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true
//         },
//         {
//           "field": "sales_status_name",
//           "headerName": "Sales Status Name",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true
//         },
//         {
//           "field": "customer_name",
//           "headerName": "Customer Name",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true
//         },
//         {
//           "field": "processing_end_date",
//           "headerName": "Processing End Date",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "sales_unit_name",
//           "headerName": "Sales Unit Name",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "probability_name",
//           "headerName": "Probability Name",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "in_account",
//           "headerName": "In Account",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "probability",
//           "headerName": "Probability",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true
//         },
//         {
//           "field": "is_bid",
//           "headerName": "Is Bid",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "OBV",
//           "headerName": "OBV",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         },
//         {
//           "field": "OBV_GM",
//           "headerName": "OBV GM",
//           "flex": 1,
//           "resizable": true,
//           "filter": "agSetColumnFilter",
//           "sortable": true,
//           "hide": true
//         }
//       ],
//       "slicer_config": [
//         {
//           "field": "sbu",
//           "isMultiSelect": false,
//           "isMultiSelectVisible": false,
//           "sort": false,
//           "title": "Sbu",
//           "type": "set"
//         },
//         {
//           "field": "bu",
//           "isMultiSelect": false,
//           "isMultiSelectVisible": false,
//           "sort": false,
//           "title": "Bu",
//           "type": "set"
//         },
//         {
//           "field": "opportunity_name",
//           "isMultiSelect": false,
//           "isMultiSelectVisible": false,
//           "sort": false,
//           "title": "Opportunity Name",
//           "type": "set"
//         },
//         {
//           "field": "sales_status_name",
//           "isMultiSelect": false,
//           "isMultiSelectVisible": false,
//           "sort": false,
//           "title": "Sales Status Name",
//           "type": "set"
//         },
//         {
//           "field": "customer_name",
//           "isMultiSelect": false,
//           "isMultiSelectVisible": false,
//           "sort": false,
//           "title": "Customer Name",
//           "type": "set"
//         },
//         {
//           "field": "in_account",
//           "isMultiSelect": false,
//           "isMultiSelectVisible": false,
//           "sort": false,
//           "title": "In Account",
//           "type": "set"
//         }
//       ],
//       "statusCardConfigs": [
//         {
//           "key": "sales_status_name",
//           "card_config": [
//             {
//               "value": "Created",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Submitted",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Closed SHS Completed",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Qualified",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Moved to SHS",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Budgetary Submitted",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Closed Cancelled",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Won",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Closed Lost",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Response Prepared",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Postponed",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Disqualified",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Negotiation Completed",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Evaluation Completed",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Contract Signed",
//               "color": "#ee4961",
//               "selected": true
//             },
//             {
//               "value": "Bid Approved",
//               "color": "#ee4961",
//               "selected": true
//             }
//           ]
//         }
//       ],
//       "application_id": 1193,
//       "created_by": 3820,
//       "created_on": {
//         "$date": "2025-08-19T07:11:13.747Z"
//       }
//     }
//     // this.isLoading = true;
//     // this.spinnerService.show();

//     this.subs.add(
//       this.CrmService.loadDataFromAPI(this.data.rowDataAPI).subscribe(
//         (result: any) => {
//           if (result['messType'] === 'S') {
//             this.rowData = result['messData'];
//           }
//         }
//       )
//     )
//     this.application_id = this.data.application_id;
//     this.summaryKey = this.data.statusCardConfigs.key;
//     this.statusItems = this.data.statusCardConfigs.map(config => {
//       // Build counts only once for the current key
//       const countMap: Record<string, number> = {};
//       this.rowData.forEach(item => {
//         const key = item[config.key]; // dynamic field (e.g. sales_status_name)
//         countMap[key] = (countMap[key] || 0) + 1;
//       });

//       // Attach counts directly to card_config
//       return {
//         ...config,
//         card_config: config.card_config.map(card => ({
//           ...card,
//           count: countMap[card.value] || 0
//         }))
//       };
//     });

//     console.log("statusItems",this.statusItems)
//     console.log("application_id",this.application_id)
//     console.log("summaryKey",this.summaryKey)
//   }
//   colDefs: ColDef[] = this.data.colDefs;
//   sideBar: SideBarDef = {
//     toolPanels: [
//       {
//         id: 'columns',
//         labelDefault: 'Columns',
//         labelKey: 'columns',
//         iconKey: 'columns',
//         toolPanel: 'agColumnsToolPanel',
//         toolPanelParams: {
//           suppressRowGroups: true,
//           suppressValues: true,
//           suppressPivots: true,
//           suppressPivotMode: true,
//           suppressSideButtons: true,
//           suppressColumnSelectAll: true,
//           suppressColumnExpandAll: true
//         }
//       }
//     ],
//     defaultToolPanel: 'filters'
//   };


//   onSlicerChanged(event: { filterModel: any; slicers: any; field: string }): void {
//     console.log("onSlicerChanged")

//     const { filterModel, slicers, field } = event;



//     // Update the filter model 

//     this.filterModel = { ...filterModel };



//     // Update the grid with the new filter model 

//     this.gridApi.setFilterModel(this.filterModel);



//     // Re-calculate filtered data from the grid 

//     const filteredData = this.getFilteredDataFromGrid();



//     // Update slicer options based on the filtered data 

//     // this.updateSlicerOptions(filteredData, slicers); 



//     // Update shared service with new filtered data 

//     this.AppSharedComponentsService.setFilteredData(filteredData);

//     // this.AppSharedComponentsService.currentColDefs(this.columnApi.getColumnState());

//   }





//   private getFilteredDataFromGrid(): any[] {

//     const filteredData: any[] = [];

//     this.gridApi.forEachNodeAfterFilter((node: any) => filteredData.push(node.data));

//     return filteredData;

//   }





//   onSearchChanged(event: { text: any }): void {

//     const { text } = event;

//     console.log("eventttt", event)

//     this.gridApi.setGridOption('quickFilterText', 'search text');

//   }

//   onStatusItemClick(item: any) {
//     // Reset all cards to unclicked state except the clicked one
//     this.statusItems.forEach(status => {
//       if (status !== item) {
//         status.selected = 0;
//       }
//     });

//     // Toggle the clicked state of the selected card
//     item.selected = item.selected === 1 ? 0 : 1;

//     if (item.selected === 1) {
//       // Apply filter model if the card is clicked
//       this.filterModel = { summaryKey: { filterType: 'set', values: [item.dataType] } };
//       if (this.gridApi) {
//         this.gridApi.setFilterModel(this.filterModel);
//       }
//     } else {
//       // Clear filter model if the card is unclicked
//       delete this.filterModel[this.summaryKey];
//       if (this.gridApi) {
//         this.gridApi.setFilterModel(this.filterModel);
//       }
//     }

//     // Always update Kanban data and grouped data
//     // this.kanbanData = this.applyFilterModelToArray(this.allLeadsData, this.filterModel);
//     // this.updateGroupedData();
//     // this.updateFilteredRowData();

//     // Optionally update shared service and column state
//     // this.AppSharedComponentsService.setFilteredData(this.kanbanData || []);
//     // if (this.columnApi && this.view === 'List') {
//     //   this.AppSharedComponentsService.currentColDefs(this.columnApi.getColumnState());
//     // }
//   }
// onGridReady(params: GridReadyEvent) {
//   this.gridApi = params.api;
//   // this.columnApi = params.columnApi;
// }
}
