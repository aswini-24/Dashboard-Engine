import { Component, OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-report-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './report-success.component.html',
  styleUrls: ['./report-success.component.scss']
})
export class ReportSuccessComponent implements OnInit {

  ngOnInit(): void {
    this.showSuccessTick();
  }

  showSuccessTick() {
    Swal.fire({
      icon: 'success',
      title: 'Report Created!',
      text: 'Your report has been created successfully.',
      showConfirmButton: false,
      timer: 1500,
      customClass: {
        popup: 'animate__animated animate__fadeInDown'
      }
    });
  }

  onViewReport(): void {
    console.log('Navigating to view the created report...');
    // You can route to another page here, for example:
    // this.router.navigate(['/reports/view']);
  }

  onCreateAnother(): void {
    console.log('Navigating to create another report...');
    // this.router.navigate(['/reports/create']);
  }
}
