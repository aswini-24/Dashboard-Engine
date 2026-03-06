import { Component, Input, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
// import { RolesService } from 'shared-lib';
import _ from 'underscore';
import { RolesService } from '../../../../../../../shared-lib/src/public-api';

@Component({
  selector: 'app-shared-currency',
  standalone: true,
  imports: [MatIconModule,MatTooltipModule],
  templateUrl: './shared-currency.component.html',
  styleUrl: './shared-currency.component.scss'
})
export class SharedCurrencyComponent {
 @Input() type: string;
  @Input() label: string;
  @Input() showActualAmount: boolean = false;
  @Input() acl: any;
  @Input() defaultCurrencyCode: any;
  @Input() currencyConvert: boolean;
  @Input() set currencyList(list) {
    this.currency = list;
    if (list) {
      const tempIndex = _.findIndex(list, l => l.currency_code == this.currency_code);
      if (tempIndex != -1) {
        this.index = tempIndex;
        this.currency[this.index].value = Math.trunc(this.currency[this.index].value);
      }
    }

  }
  currency: any = [];
  index: any;
  currency_code: any;
  tenant_info: any;
  tenantName: any;

  isConvertValue: any;

  constructor(private roleService: RolesService) {

  }

  ngOnInit() {
    console.log('defaultCurrencyCode',this.defaultCurrencyCode);
    console.log('currencyConvert',this.currencyConvert);
    console.log('currencyList',this.roleService.currency_info);
    console.log('type',this.type);
    if (this.currencyConvert === undefined || this.currencyConvert === null) {
      this.currencyConvert = true;
    }

    this.tenant_info = this.roleService.currency_info

    // this.tenantName = this.tenant_info.tenant_name;
    
    this.currency_code = this.defaultCurrencyCode ? this.defaultCurrencyCode : this.tenant_info.default_currency ? this.tenant_info.default_currency : "INR";
    
    this.setCurrency()
    console.log('cc',this.tenant_info);
    this.isConvertValue = this.tenant_info.is_to_convert_currency_value != null ? this.tenant_info.is_to_convert_currency_value : true;


  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['defaultCurrencyCode'] && !changes['defaultCurrencyCode'].firstChange) {
      this.currency_code = this.defaultCurrencyCode; // Update currency code
      this.setCurrency();
    }
  }

  setCurrency() {

    if (this.currency) {

      const tempIndex = _.findIndex(this.currency, l => l.currency_code == this.currency_code);
      if (tempIndex != -1) {
        this.index = tempIndex;
        this.currency[this.index].value = Math.trunc(this.currency[this.index].value);
      }

    }

  }

  change() {


    if (typeof event.stopPropagation != "undefined") {
      event.stopPropagation();
    } else if (typeof event.cancelBubble != "undefined") {
      event.cancelBubble = true;
    }
    if (this.currency.length > 1)
      this.index = ++this.index % this.currency.length;
    this.currency[this.index].value = Math.trunc(this.currency[this.index].value);


  }

  convert(val, code) {
    if (!val) {
      return "-";
    }
    else if (this.showActualAmount) {
      if (code == "INR") val = (val) + ` ${code}`;
      else val = (val) + ` ${code}`
    }
    else {

      if (this.isConvertValue == true) {

        if (code == "INR")
          val = (val / 10000000).toFixed(2) + " Cr";
        else
          val = (val / 1000000).toFixed(2) + " M";

      } else if (this.isConvertValue == false && !_.contains(['big', 'small'], this.type)) {
        if (code == "INR")
          val = (val / 10000000).toFixed(2) + " Cr";
        else
          val = (val / 1000000).toFixed(2) + " M";
      } else if (this.isConvertValue == false && _.contains(['big', 'small'], this.type)) {
        if (code == "INR")
          val = "INR " + new Intl.NumberFormat('en-IN', {}).format(val)
        else
          val = "USD " + new Intl.NumberFormat('en-US', {}).format(val)

      }

    }

    // else if (val >= 100000) val = (val / 100000).toFixed(2) + " L";
    // else if (val >= 1000) val = (val / 1000).toFixed(2) + " K";
    return val;
  }
}
