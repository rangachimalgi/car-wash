import React from 'react';
import ServiceDetailsLayout from '../components/ServiceDetailsLayout';

export default function CarWashDetailsScreen({ navigation, route }) {
  const { serviceTitle = "Basic Routine Cleaning" } = route.params || {};

  // Determine image and specs based on service
  const getServiceData = () => {
    if (serviceTitle.includes("Basic")) {
      return {
        imageUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=400&fit=crop',
        specs: { duration: "30 mins", rating: "4.2", weight: "Quick" },
        included: [
          "Exterior Ceramic Wash",
          "Tyre Polish",
        ],
        notIncluded: [
          "Normal Interior Cleaning",
          "Dashboard Polish",
          "30 Days Air Freshener",
          "Dustbin",
          "Tissue Box",
          "Bucket Car Ceramic Wash",
          "340 GSM Microfiber Cloth",
          "Windshield Cleaning Tablet and Refill",
          "Odour Eliminator",
        ]
      };
    } else if (serviceTitle.includes("Premium")) {
      return {
        imageUri: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=800&h=400&fit=crop',
        specs: { duration: "2 hours", rating: "4.6", weight: "Standard" },
        included: [
          "Exterior Ceramic Wash",
          "Tyre Polish",
          "Normal Interior Cleaning",
          "Dashboard Polish",
          "340 GSM Microfiber Cloth",
        ],
        notIncluded: [
          "30 Days Air Freshener",
          "Dustbin",
          "Tissue Box",
          "Bucket Car Ceramic Wash",
          "Windshield Cleaning Tablet and Refill",
          "Odour Eliminator",
        ]
      };
    } else {
      return {
        imageUri: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&h=400&fit=crop',
        specs: { duration: "3 hours", rating: "4.4", weight: "Deep" },
        included: [
          "Exterior Ceramic Wash",
          "Tyre Polish",
          "Normal Interior Cleaning",
          "Dashboard Polish",
          "30 Days Air Freshener",
          "340 GSM Microfiber Cloth",
          "Windshield Cleaning Tablet and Refill",
          "Odour Eliminator",
        ],
        notIncluded: [
          "Dustbin",
          "Tissue Box",
          "Bucket Car Ceramic Wash",
        ]
      };
    }
  };

  // Add-on services
  const addOnServices = [
    {
      imageUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      title: 'Floor Deep Cleaning',
      price: 69,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=200&h=200&fit=crop',
      title: 'Door Deep Cleaning',
      price: 139,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=200&h=200&fit=crop',
      title: 'Underbody Cleaning',
      price: 49,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      title: 'Hybrid Ceramic Coat',
      price: 159,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=200&h=200&fit=crop',
      title: 'Engine Bay Cleaning',
      price: 199,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=200&h=200&fit=crop',
      title: 'Headlight Restoration',
      price: 299,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      title: 'Interior Sanitization',
      price: 249,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=200&h=200&fit=crop',
      title: 'Paint Protection Film',
      price: 599,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=200&h=200&fit=crop',
      title: 'Leather Conditioning',
      price: 179,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop',
      title: 'Tire Dressing',
      price: 89,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=200&h=200&fit=crop',
      title: 'Windshield Treatment',
      price: 129,
    },
  ];

  return (
    <ServiceDetailsLayout
      navigation={navigation}
      route={route}
      getServiceData={getServiceData}
      categoryText="CAR WASH SERVICE"
      addOnServices={addOnServices}
    />
  );
}

