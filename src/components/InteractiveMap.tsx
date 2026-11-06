import React, { useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from '@vis.gl/react-google-maps';
import { Flame, Navigation, MapPin } from 'lucide-react';
import { Order } from '../types/restaurant';

interface InteractiveMapProps {
  orders?: Order[];
  heightClass?: string;
  showOrderPins?: boolean;
}

const RESTAURANT_COORDS = { lat: -31.7145, lng: -55.9825 };

// Deterministic offset around Tacuarembo center for order addresses
function getOrderCoordinates(orderId: string, idx: number) {
  const hash = orderId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const latOffset = ((hash % 14) - 7) * 0.0012 + (idx % 3) * 0.0006;
  const lngOffset = (((hash >> 2) % 14) - 7) * 0.0014 - (idx % 2) * 0.0005;
  return {
    lat: RESTAURANT_COORDS.lat + latOffset,
    lng: RESTAURANT_COORDS.lng + lngOffset,
  };
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  orders = [],
  heightClass = 'h-72 sm:h-80',
  showOrderPins = false,
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [selectedPin, setSelectedPin] = useState<'restaurant' | string | null>('restaurant');

  const deliveryOrders = orders.filter(
    (o) => o.type === 'delivery' && o.status !== 'cancelled'
  );

  if (!apiKey) {
    return (
      <div className={`w-full ${heightClass} rounded-2xl bg-stone-900 border border-stone-800 flex flex-col items-center justify-center p-6 text-center`}>
        <MapPin className="w-8 h-8 text-orange-500 mb-2" />
        <p className="text-xs font-bold text-white uppercase">
          Mapa Interactivo — 18 de Julio 245 esq. 25 de Mayo, Tacuarembó
        </p>
        <p className="text-[11px] text-stone-400 mt-1">
          Coordenadas: -31.7145, -55.9825
        </p>
      </div>
    );
  }

  return (
    <div className={`w-full ${heightClass} rounded-2xl overflow-hidden border border-stone-800 relative shadow-xl`}>
      <APIProvider apiKey={apiKey} libraries={['marker']} language="es" region="UY">
        <GoogleMap
          mapId="DEMO_MAP_ID"
          defaultZoom={15}
          defaultCenter={RESTAURANT_COORDS}
          gestureHandling="greedy"
          disableDefaultUI={false}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Main Restaurant Pin */}
          <AdvancedMarker
            position={RESTAURANT_COORDS}
            title="Brasa & Lúpulo — Casa Central"
            onClick={() => setSelectedPin('restaurant')}
          >
            <Pin
              background="#ea580c"
              borderColor="#fbbf24"
              glyphColor="#ffffff"
              scale={1.25}
            />
          </AdvancedMarker>

          {selectedPin === 'restaurant' && (
            <InfoWindow
              position={RESTAURANT_COORDS}
              onCloseClick={() => setSelectedPin(null)}
              maxWidth={240}
            >
              <div className="text-stone-900 p-1 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1 text-orange-600">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Brasa & Lúpulo</span>
                </div>
                <p className="font-semibold">18 de Julio 245 esq. 25 de Mayo</p>
                <p className="text-[11px] text-stone-600">Tacuarembó, Uruguay • Cocina y Taproom</p>
              </div>
            </InfoWindow>
          )}

          {/* Active Delivery Order Pins */}
          {showOrderPins &&
            deliveryOrders.map((order, idx) => {
              const pos = getOrderCoordinates(order.id, idx);
              const isDelivered = order.status === 'delivered';
              return (
                <React.Fragment key={order.id}>
                  <AdvancedMarker
                    position={pos}
                    title={`Pedido ${order.orderNumber} - ${order.customer.name}`}
                    onClick={() => setSelectedPin(order.id)}
                  >
                    <Pin
                      background={isDelivered ? '#10b981' : '#f59e0b'}
                      borderColor="#1c1917"
                      glyphColor="#1c1917"
                      scale={1.05}
                    />
                  </AdvancedMarker>

                  {selectedPin === order.id && (
                    <InfoWindow
                      position={pos}
                      onCloseClick={() => setSelectedPin(null)}
                      maxWidth={240}
                    >
                      <div className="text-stone-900 p-1 text-xs space-y-1">
                        <div className="font-black text-amber-700">
                          {order.orderNumber} • {order.customer.name}
                        </div>
                        <p className="font-medium">{order.customer.address}</p>
                        <p className="text-[11px] text-stone-600">
                          Total: ${order.total} $U • Estado: {order.status}
                        </p>
                      </div>
                    </InfoWindow>
                  )}
                </React.Fragment>
              );
            })}
        </GoogleMap>
      </APIProvider>
    </div>
  );
};
