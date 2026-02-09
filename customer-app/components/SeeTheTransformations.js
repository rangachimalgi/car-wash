import React from 'react';
import CustomerTestimonials from './CustomerTestimonials';

const DEFAULT_ITEMS = [
  { id: 't1', name: 'Before / After', image: require('../assets/carImage.jpeg') },
  { id: 't2', name: 'Premium Shine', image: require('../assets/carImage.jpeg') },
  { id: 't3', name: 'Deep Clean', image: require('../assets/carImage.jpeg') },
];

export default function SeeTheTransformations({ items = DEFAULT_ITEMS, onPressItem }) {
  return (
    <CustomerTestimonials
      title="See The Transformations"
      items={items}
      onPressItem={onPressItem}
    />
  );
}

