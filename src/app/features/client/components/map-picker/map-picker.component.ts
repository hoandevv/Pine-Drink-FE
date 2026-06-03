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
  isLocating = false;
  isPreviewLocating = false;
  locationError = '';

  private searchSubject = new Subject<string>();
  private readonly defaultCenter: L.LatLngExpression = [21.028511, 105.804817]; // Hanoi
  private readonly defaultZoom = 13;

  constructor(private readonly geocodingService: GeocodingService) { }

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
        switchMap((rawQuery) => {
          const query = rawQuery.trim();

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
    this.placeMarker(result.latitude, result.longitude);

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

  useCurrentLocation(): void {
    this.locationError = '';

    if (!navigator.geolocation) {
      this.locationError = 'Trình duyệt không hỗ trợ định vị.';
      return;
    }

    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.placeMarker(lat, lng, 17, this.createCurrentLocationIcon());
        this.resolveCurrentAddress(lat, lng);
      },
      () => {
        this.isLocating = false;
        this.locationError = 'Không lấy được vị trí. Vui lòng cấp quyền định vị cho trình duyệt.';
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      }
    );
  }

  showCurrentLocationOnMap(): void {
    this.locationError = '';

    if (!navigator.geolocation) {
      this.locationError = 'Trình duyệt không hỗ trợ định vị.';
      return;
    }

    this.isPreviewLocating = true;
    navigator.geolocation.getCurrentPosition(
      position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.isPreviewLocating = false;
        this.placeMarker(lat, lng, 17, this.createCurrentLocationIcon());
      },
      () => {
        this.isPreviewLocating = false;
        this.locationError = 'Không lấy được vị trí. Vui lòng cấp quyền định vị cho trình duyệt.';
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      }
    );
  }

  private placeMarker(lat: number, lng: number, zoom = 16, icon?: L.Icon | L.DivIcon): void {
    const latLng: L.LatLngExpression = [lat, lng];
    this.map.setView(latLng, zoom, { animate: true });

    if (this.marker) {
      this.map.removeLayer(this.marker);
    }

    this.marker = L.marker(latLng, { draggable: true, icon }).addTo(this.map);
    this.marker.on('dragend', () => {
      const position = this.marker.getLatLng();
      this.onMarkerDragged(position.lat, position.lng);
    });
  }

  private createCurrentLocationIcon(): L.DivIcon {
    return L.divIcon({
      className: 'current-location-marker',
      html: `
        <span class="current-location-marker__pulse"></span>
        <span class="current-location-marker__dot">
          <span class="material-symbols-outlined">my_location</span>
        </span>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });
  }

  private resolveCurrentAddress(lat: number, lng: number): void {
    this.isReverseGeocoding = true;
    this.geocodingService
      .reverseGeocode(lat, lng)
      .pipe(catchError(() => this.reverseGeocodeWithNominatim(lat, lng)))
      .subscribe((location) => {
        this.isLocating = false;
        this.isReverseGeocoding = false;
        this.currentLocation = location;
        this.searchQuery = location.displayName || 'Vị trí hiện tại của tôi';
        this.locationSelected.emit(location);
      });
  }

  private reverseGeocodeWithNominatim(lat: number, lng: number) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=vi&addressdetails=1`;

    return fetch(url)
      .then(response => response.ok ? response.json() : null)
      .then(data => this.mapNominatimResult(data, lat, lng))
      .catch(() => ({ latitude: lat, longitude: lng } as MapPickerResult));
  }

  private mapNominatimResult(data: any, lat: number, lng: number): MapPickerResult {
    if (!data) {
      return { latitude: lat, longitude: lng };
    }

    const address = data.address || {};
    const roadParts = [address.house_number, address.road || address.pedestrian || address.neighbourhood]
      .filter(Boolean);

    return {
      latitude: lat,
      longitude: lng,
      displayName: data.display_name || 'Vị trí hiện tại của tôi',
      addressLine: roadParts.join(' ') || data.name || data.display_name,
      ward: address.suburb || address.quarter || address.village || address.ward || null,
      district: address.city_district || address.district || address.county || null,
      city: address.city || address.town || address.state || null
    };
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
