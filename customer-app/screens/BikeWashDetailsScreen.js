import React from 'react';
import ServiceDetailsLayout from '../components/ServiceDetailsLayout';

export default function BikeWashDetailsScreen({ navigation, route }) {
  const { serviceTitle = "Basic Bike Wash" } = route.params || {};

  // Determine image and specs based on service
  const getServiceData = () => {
    if (serviceTitle.includes("Basic")) {
      return {
        imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
        specs: { duration: "20 mins", rating: "4.3", weight: "Quick" },
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
          "Bucket Bike Ceramic Wash",
          "340 GSM Microfiber Cloth",
          "Windshield Cleaning Tablet and Refill",
          "Odour Eliminator",
        ]
      };
    } else if (serviceTitle.includes("Premium")) {
      return {
        imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
        specs: { duration: "1 hour", rating: "4.7", weight: "Standard" },
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
          "Bucket Bike Ceramic Wash",
          "Windshield Cleaning Tablet and Refill",
          "Odour Eliminator",
        ]
      };
    } else {
      return {
        imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&h=400&fit=crop&auto=format',
        specs: { duration: "2 hours", rating: "4.5", weight: "Deep" },
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
          "Bucket Bike Ceramic Wash",
        ]
      };
    }
  };

  // Add-on services
  const addOnServices = [
    {
      imageUri: 'https://images.unsplash.com/photo-1558980664-1db506751c6a?w=200&h=200&fit=crop',
      title: 'Chain Deep Cleaning',
      price: 79,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&h=200&fit=crop',
      title: 'Engine Bay Cleaning',
      price: 149,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558980664-1db506751c6a?w=200&h=200&fit=crop',
      title: 'Underbody Cleaning',
      price: 59,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&h=200&fit=crop',
      title: 'Hybrid Ceramic Coat',
      price: 199,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558980664-1db506751c6a?w=200&h=200&fit=crop',
      title: 'Seat Deep Cleaning',
      price: 129,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&h=200&fit=crop',
      title: 'Tank Polish',
      price: 179,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558980664-1db506751c6a?w=200&h=200&fit=crop',
      title: 'Wheel Rim Polish',
      price: 149,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&h=200&fit=crop',
      title: 'Headlight Restoration',
      price: 249,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558980664-1db506751c6a?w=200&h=200&fit=crop',
      title: 'Tire Dressing',
      price: 99,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=200&h=200&fit=crop',
      title: 'Windshield Treatment',
      price: 139,
    },
    {
      imageUri: 'https://images.unsplash.com/photo-1558980664-1db506751c6a?w=200&h=200&fit=crop',
      title: 'Handlebar Polish',
      price: 89,
    },
  ];

  return (
    <ServiceDetailsLayout
      navigation={navigation}
      route={route}
      getServiceData={getServiceData}
      categoryText="BIKE WASH SERVICE"
      addOnServices={addOnServices}
    />
  );
}

