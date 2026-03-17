import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Style, Icon } from 'ol/style';
import '../css/LocationMap.css';

const LocationMap = ({ 
  onLocationSelect, 
  initialLocation = null,
  editable = true,
  height = '400px' 
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerLayerRef = useRef(null);
  
  const [address, setAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // PRVI useEffect - inicijalizacija mape
  useEffect(() => {
    if (!mapRef.current) return;

    const markerSource = new VectorSource();
    const markerLayer = new VectorLayer({
      source: markerSource,
      style: new Style({
        image: new Icon({
          anchor: [0.5, 1],
          src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="%23ff69b4" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
          scale: 1.5
        })
      })
    });
    markerLayerRef.current = markerLayer;

    let initialCenter = [20.4489, 44.7866];
    let initialZoom = 12;

    if (initialLocation && initialLocation.longitude && initialLocation.latitude) {
      initialCenter = [initialLocation.longitude, initialLocation.latitude];
      initialZoom = 15;
      if (initialLocation.fullAddress) {
        setAddress(initialLocation.fullAddress);
      }
    }

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM()
        }),
        markerLayer
      ],
      view: new View({
        center: fromLonLat(initialCenter),
        zoom: initialZoom
      })
    });

    mapInstanceRef.current = map;

    if (initialLocation && initialLocation.longitude && initialLocation.latitude) {
      addMarker(initialLocation.longitude, initialLocation.latitude);
    }

    if (editable) {
      map.on('click', async (event) => {
        const coordinates = toLonLat(event.coordinate);
        const [longitude, latitude] = coordinates;
        
        addMarker(longitude, latitude);
        
        const locationData = await reverseGeocode(latitude, longitude);
        
        if (locationData.fullAddress) {
          setAddress(locationData.fullAddress);
        }
        
        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
      });
    }

    return () => {
      map.setTarget(null);
    };
  }, []);

  // NOVI useEffect - ažurira mapu kad se initialLocation promeni
  useEffect(() => {
    if (!mapInstanceRef.current || !initialLocation) return;
    
    if (initialLocation.longitude && initialLocation.latitude) {
      const view = mapInstanceRef.current.getView();
      view.setCenter(fromLonLat([initialLocation.longitude, initialLocation.latitude]));
      view.setZoom(15);
      
      addMarker(initialLocation.longitude, initialLocation.latitude);
      
      if (initialLocation.fullAddress) {
        setAddress(initialLocation.fullAddress);
      }
    }
  }, [initialLocation]);

  const addMarker = (longitude, latitude) => {
    if (!markerLayerRef.current) return;
    
    const markerSource = markerLayerRef.current.getSource();
    markerSource.clear();
    
    const marker = new Feature({
      geometry: new Point(fromLonLat([longitude, latitude]))
    });
    
    markerSource.addFeature(marker);
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );
      const data = await response.json();
      
      return {
        latitude,
        longitude,
        street: data.address.road || '',
        houseNumber: data.address.house_number || '',
        city: data.address.city || data.address.town || data.address.village || '',
        postalCode: data.address.postcode || '',
        country: data.address.country || '',
        fullAddress: data.display_name || ''
      };
    } catch (error) {
      console.error('Greška pri reverse geocoding:', error);
      return {
        latitude,
        longitude,
        street: '',
        houseNumber: '',
        city: '',
        postalCode: '',
        country: '',
        fullAddress: `${latitude}, ${longitude}`
      };
    }
  };

  const handleAddressSearch = async () => {
    if (!address.trim() || !editable) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&addressdetails=1&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const latitude = parseFloat(result.lat);
        const longitude = parseFloat(result.lon);
        
        const view = mapInstanceRef.current.getView();
        view.setCenter(fromLonLat([longitude, latitude]));
        view.setZoom(15);
        
        addMarker(longitude, latitude);
        
        const locationData = {
          latitude,
          longitude,
          street: result.address.road || '',
          houseNumber: result.address.house_number || '',
          city: result.address.city || result.address.town || result.address.village || '',
          postalCode: result.address.postcode || '',
          country: result.address.country || '',
          fullAddress: result.display_name || ''
        };
        
        setAddress(locationData.fullAddress);
        
        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
      } else {
        alert('Lokacija nije pronađena. Pokušajte sa drugačijom adresom.');
      }
    } catch (error) {
      console.error('Greška pri pretrazi:', error);
      alert('Greška pri pretrazi lokacije.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddressSearch();
    }
  };

  return (
    <div className="location-map-container">
      {editable && (
        <div className="map-search-bar">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Unesite adresu (npr. Knez Mihailova 1, Beograd)"
            className="map-search-input"
          />
          <button 
            onClick={handleAddressSearch} 
            disabled={isSearching}
            className="map-search-btn"
          >
            {isSearching ? 'Pretražujem...' : 'Pretraži'}
          </button>
        </div>
      )}
      
      <div 
        ref={mapRef} 
        className="map-element" 
        style={{ height }}
      />
      
      {editable && (
        <p className="map-hint">
          Kliknite na mapu da označite tačnu lokaciju ili pretražite adresu
        </p>
      )}
    </div>
  );
};

export default LocationMap;