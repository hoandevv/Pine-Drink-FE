import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import * as L from 'leaflet';
import { Subject, debounceTime, distinctUntilChanged, switchMap, catchError, of } from 'rxjs';

import { GeocodingService } from '../../../../core/services/geocoding.service';
import { GeocodingResult } from '../../../../shared/models/geocoding.model';

export interface MapPickerResult {
  latitude: number;
  longitude: number;
  displayName?: string;
  addressLine?: string;
  ward?: string | null;
  district?: string | null;
  city?: string | null;
}

@Component({
  selector: 'app-map-picker',
  templateUrl: './map-picker.component.html',
  styleUrls: ['./map-picker.component.scss']
})
export class MapPickerComponent implements OnInit, OnDestroy {
  @Output() locationSelected = new EventEmitter<MapPickerResult>();

  map!: L.Map;
  marker!: L.Marker;
  searchQuery = '';
  searchResults: GeocodingResult[] = [];
  isSearching = false;
  isReverseGeocoding = false;
  showResults = false;
  currentLocation: MapPickerResult | null = null;

  private searchSubject = new Subject<string>();
  private readonly defaultCenter: L.LatLngExpression = [21.028511, 105.804817]; // Hanoi
  private readonly defaultZoom = 13;

  constructor(private readonly geocodingService: GeocodingService) {}

  ngOnInit(): void {
    this.initMap();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    this.searchSubject.complete();
  }

  private initMap(): void {
    // Initialize map
    this.map = L.map('map', {
      center: this.defaultCenter,
      zoom: this.defaultZoom
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    // Fix marker icon issue with Leaflet + Angular
    const iconRetinaUrl = 'assets/marker-icon-2x.png';
    const iconUrl = 'assets/marker-icon.png';
    const shadowUrl = 'assets/marker-shadow.png';
    const iconDefault = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((query) => {
          if (!query || query.length < 3) {
            this.searchResults = [];
            this.showResults = false;
            return of([]);
          }

          this.isSearching = true;
          return this.geocodingService.searchAddress({ query, limit: 5 }).pipe(
            catchError(() => {
              this.isSearching = false;
              return of([]);
            })
          );
        })
      )
      .subscribe((results) => {
        this.searchResults = results;
        this.isSearching = false;
        this.showResults = results.length > 0;
      });
  }

  onSearchInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  selectResult(result: GeocodingResult): void {
    // Center map on selected location
    const latLng: L.LatLngExpression = [result.latitude, result.longitude];
    this.map.setView(latLng, 16);

    // Remove existing marker if any
    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    // Add draggable marker
    this.marker = L.marker(latLng, { draggable: true }).addTo(this.map);

    // Handle marker drag
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.onMarkerDragged(position.lat, position.lng);
    });

    // Update current location
    this.currentLocation = {
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: result.displayName,
      addressLine: result.addressLine,
      ward: result.ward,
      district: result.district,
      city: result.city
    };

    // Emit location
    this.locationSelected.emit(this.currentLocation);

    // Clear search
    this.searchQuery = result.displayName;
    this.showResults = false;
    this.searchResults = [];
  }

  private onMarkerDragged(lat: number, lng: number): void {
    this.isReverseGeocoding = true;

    this.geocodingService
      .reverseGeocode(lat, lng)
      .pipe(
        catchError(() => {
          // If reverse geocoding fails, still emit coordinates
          this.isReverseGeocoding = false;
          const fallbackLocation: MapPickerResult = {
            latitude: lat,
            longitude: lng
          };
          this.currentLocation = fallbackLocation;
          this.locationSelected.emit(fallbackLocation);
          return of(null);
        })
      )
      .subscribe((result) => {
        this.isReverseGeocoding = false;

        if (result) {
          this.currentLocation = {
            latitude: result.latitude,
            longitude: result.longitude,
            displayName: result.displayName,
            addressLine: result.addressLine,
            ward: result.ward,
            district: result.district,
            city: result.city
          };

          this.searchQuery = result.displayName;
          this.locationSelected.emit(this.currentLocation);
        }
      });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
  }

  closeResults(): void {
    this.showResults = false;
  }
}
