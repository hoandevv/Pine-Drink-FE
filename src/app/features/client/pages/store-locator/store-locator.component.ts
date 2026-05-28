import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MOCK_BRANCHES, MockBranch } from '../../../../shared/mock-data';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-store-locator',
  templateUrl: './store-locator.component.html',
  styleUrls: ['./store-locator.component.scss']
})
export class StoreLocatorComponent implements OnInit {
  allBranches: MockBranch[] = [];
  filteredBranches: MockBranch[] = [];
  selectedBranch: MockBranch | null = null;

  mapImageUrl: string;
  
  searchQuery: string = '';
  filterNearby: boolean = true;
  filterOpen: boolean = false;
  filterPickup: boolean = false;
  filterDelivery: boolean = false;

  constructor(private router: Router) {
    this.mapImageUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v10/static/105.8342,21.0278,11,0/800x1000@2x?access_token=${environment.mapboxAccessToken}`;
  }

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.allBranches = MOCK_BRANCHES.sort((a, b) => a.distanceKm - b.distanceKm);
    this.filteredBranches = [...this.allBranches];
    
    // Select nearest branch by default
    if (this.allBranches.length > 0) {
      this.selectedBranch = this.allBranches[0];
    }
    
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.allBranches];

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(branch => 
        branch.name.toLowerCase().includes(query) ||
        branch.address.toLowerCase().includes(query) ||
        branch.district.toLowerCase().includes(query)
      );
    }

    // Filter by nearby (within 5km)
    if (this.filterNearby) {
      filtered = filtered.filter(branch => branch.distanceKm <= 5);
    }

    // Filter by open status
    if (this.filterOpen) {
      filtered = filtered.filter(branch => branch.isOpen);
    }

    // Filter by pickup availability
    if (this.filterPickup) {
      filtered = filtered.filter(branch => branch.hasPickup);
    }

    // Filter by delivery availability
    if (this.filterDelivery) {
      filtered = filtered.filter(branch => branch.hasDelivery);
    }

    this.filteredBranches = filtered;
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  toggleFilter(filterName: 'nearby' | 'open' | 'pickup' | 'delivery'): void {
    switch (filterName) {
      case 'nearby':
        this.filterNearby = !this.filterNearby;
        break;
      case 'open':
        this.filterOpen = !this.filterOpen;
        break;
      case 'pickup':
        this.filterPickup = !this.filterPickup;
        break;
      case 'delivery':
        this.filterDelivery = !this.filterDelivery;
        break;
    }
    this.applyFilters();
  }

  selectBranch(branch: MockBranch): void {
    this.selectedBranch = branch;
  }

  confirmBranch(branch: MockBranch): void {
    // TODO: Save selected branch to service/state
    console.log('Selected branch:', branch);
    this.router.navigate(['/client/menu']);
  }

  getStatusClass(branch: MockBranch): string {
    return branch.isOpen ? 'open' : 'closed';
  }

  getStatusText(branch: MockBranch): string {
    return branch.isOpen ? 'Đang mở cửa' : 'Đã đóng cửa';
  }
}
