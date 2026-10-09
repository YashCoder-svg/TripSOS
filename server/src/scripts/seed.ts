import mongoose from 'mongoose';
import argon2 from 'argon2';
import { connectToDatabase, disconnectDatabase } from '../config/mongodb.js';
import { User } from '../models/User.js';
import { Trip } from '../models/Trip.js';
import { TripMember } from '../models/TripMember.js';
import { ItineraryItem } from '../models/ItineraryItem.js';
import { Expense } from '../models/Expense.js';
import { TripMessage } from '../models/TripMessage.js';
import { EmergencyContact } from '../models/EmergencyContact.js';
import { SavedPlace } from '../models/SavedPlace.js';
import { Notification } from '../models/Notification.js';

async function seed() {
  console.log('🚀 Connecting to MongoDB for TripSOS Seed...');
  await connectToDatabase();

  console.log('🧹 Cleaning existing demo accounts...');
  const demoEmails = ['traveler@tripsos.org', 'alex@tripsos.org', 'priya@tripsos.org'];
  const existingUsers = await User.find({ email: { $in: demoEmails } });
  const userIds = existingUsers.map((u) => u._id);

  if (userIds.length > 0) {
    const tripIds = await Trip.find({ owner: { $in: userIds } }).distinct('_id');
    await ItineraryItem.deleteMany({ trip: { $in: tripIds } });
    await Expense.deleteMany({ trip: { $in: tripIds } });
    await TripMember.deleteMany({ trip: { $in: tripIds } });
    await TripMessage.deleteMany({ trip: { $in: tripIds } });
    await SavedPlace.deleteMany({ user: { $in: userIds } });
    await EmergencyContact.deleteMany({ userId: { $in: userIds } });
    await Notification.deleteMany({ recipient: { $in: userIds } });
    await Trip.deleteMany({ _id: { $in: tripIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }

  console.log('👤 Creating verified demo users...');
  const passwordHash = await argon2.hash('TripSOS2026!', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  const traveler = await User.create({
    name: 'Kabir Verma',
    email: 'traveler@tripsos.org',
    passwordHash,
    language: 'en',
    travelPreferences: {
      travelStyle: 'adventure',
      budgetPreference: 'moderate',
      dietaryPreferences: ['Vegetarian'],
    },
  });

  const alex = await User.create({
    name: 'Alex Rivera',
    email: 'alex@tripsos.org',
    passwordHash,
    language: 'en',
    travelPreferences: {
      travelStyle: 'nature',
      budgetPreference: 'budget',
    },
  });

  const priya = await User.create({
    name: 'Priya Nair',
    email: 'priya@tripsos.org',
    passwordHash,
    language: 'en',
    travelPreferences: {
      travelStyle: 'food',
      budgetPreference: 'moderate',
    },
  });

  console.log('🛡️ Creating trusted emergency contacts...');
  await EmergencyContact.create([
    {
      userId: traveler._id,
      name: 'Rohit Verma',
      relationship: 'family',
      phone: '+91 98100 12345',
      isPrimary: true,
      priority: 1,
    },
    {
      userId: traveler._id,
      name: 'Dr. Ananya Sen',
      relationship: 'other',
      phone: '+91 98200 54321',
      isPrimary: false,
      priority: 2,
    },
  ]);

  console.log('📍 Seeding Saved Places...');
  await SavedPlace.create([
    {
      user: traveler._id,
      name: 'Café 1947',
      category: 'cafes',
      address: 'Old Manali, Himachal Pradesh',
      coordinates: { latitude: 32.2541, longitude: 77.1783 },
      phone: '+91 98160 19470',
      userNotes: 'Peaceful riverside seating, authentic wood-fired oven.',
    },
    {
      user: traveler._id,
      name: 'Civil Hospital Manali',
      category: 'hospitals',
      address: 'The Mall Road, Manali, HP',
      coordinates: { latitude: 32.242, longitude: 77.1895 },
      phone: '+91 1902 252220',
      userNotes: '24/7 emergency casualty ward and mountain altitude oxygen care.',
    },
    {
      user: traveler._id,
      name: 'Himalayan Bike Repairs & 4x4 Towing',
      category: 'repair',
      address: 'Near Club House, Old Manali',
      coordinates: { latitude: 32.251, longitude: 77.175 },
      phone: '+91 98055 44332',
      userNotes: 'Puncture repair and tow truck support for Rohtang Pass route.',
    },
  ]);

  console.log('🏔️ Creating realistic trips...');
  const now = new Date();
  const startDay = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;
  const endDay = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]!;

  const trip1 = await Trip.create({
    owner: traveler._id,
    tripCode: 'TRP-82K7',
    name: 'Himalayan Ridge & Old Manali Explorer',
    destinationName: 'Manali, Himachal Pradesh, India',
    destinationCountry: 'India',
    destinationCoordinates: { latitude: 32.2396, longitude: 77.1887 },
    destination: {
      formattedAddress: 'Manali, Kullu District, Himachal Pradesh, India',
      city: 'Manali',
      region: 'Himachal Pradesh',
      country: 'India',
      coordinates: { latitude: 32.2396, longitude: 77.1887 },
    },
    startDate: startDay,
    endDate: endDay,
    travelerCount: 3,
    budget: 45000,
    currency: 'INR',
    travelStyle: 'adventure',
    interests: ['nature', 'food', 'adventure', 'photography'],
    status: 'upcoming',
  });

  // Attach members
  await TripMember.create([
    {
      trip: trip1._id,
      user: traveler._id,
      role: 'owner',
      status: 'active',
      joinedAt: new Date(),
    },
    {
      trip: trip1._id,
      user: alex._id,
      role: 'member',
      status: 'active',
      joinedAt: new Date(),
    },
    {
      trip: trip1._id,
      user: priya._id,
      role: 'member',
      status: 'active',
      joinedAt: new Date(),
    },
  ]);

  console.log('🗓️ Creating day-by-day Itinerary...');
  await ItineraryItem.create([
    {
      trip: trip1._id,
      date: startDay,
      order: 0,
      title: 'Arrival & Altitude Acclimatization',
      description: 'Check in, hydrate, rest, and stroll through Mall Road.',
      category: 'lodging',
      location: 'Old Manali Homestay',
      coordinates: { latitude: 32.253, longitude: 77.177 },
      status: 'planned',
    },
    {
      trip: trip1._id,
      date: startDay,
      order: 1,
      title: 'Dinner at Café 1947 by Manalsu River',
      description: 'Wood fired pizza and hot ginger lemon tea.',
      category: 'food',
      location: 'Old Manali bridge',
      coordinates: { latitude: 32.2541, longitude: 77.1783 },
      status: 'planned',
    },
  ]);

  console.log('💰 Recording Group Expenses...');
  await Expense.create([
    {
      trip: trip1._id,
      paidBy: traveler._id,
      amount: 12000,
      currency: 'INR',
      description: 'Cottage Booking (5 nights)',
      category: 'hotel',
      date: startDay,
      splitMethod: 'equal',
      participants: [
        { user: traveler._id, shareAmount: 4000 },
        { user: alex._id, shareAmount: 4000 },
        { user: priya._id, shareAmount: 4000 },
      ],
      notes: 'Paid via UPI advance.',
    },
    {
      trip: trip1._id,
      paidBy: priya._id,
      amount: 3600,
      currency: 'INR',
      description: 'Delhi to Manali Volvo Bus Tickets',
      category: 'transport',
      date: startDay,
      splitMethod: 'percentage',
      participants: [
        { user: traveler._id, shareAmount: 1200, percentage: 33.33 },
        { user: alex._id, shareAmount: 1200, percentage: 33.33 },
        { user: priya._id, shareAmount: 1200, percentage: 33.34 },
      ],
    },
  ]);

  console.log('💬 Seeding Group Chat & Announcements...');
  await TripMessage.create([
    {
      trip: trip1._id,
      sender: traveler._id,
      senderName: 'Kabir Verma',
      type: 'announcement',
      content: '🚨 Weather warning: Light snowfall expected near Solang Pass. Pack thermal layers!',
      pinned: true,
    },
    {
      trip: trip1._id,
      sender: alex._id,
      senderName: 'Alex Rivera',
      type: 'chat',
      content: 'I brought high-altitude motion sickness pills and extra power banks.',
    },
    {
      trip: trip1._id,
      sender: priya._id,
      senderName: 'Priya Nair',
      type: 'chat',
      content: 'Perfect! I rented the GoPro and extra batteries.',
    },
  ]);

  console.log('🔔 Adding Notifications...');
  await Notification.create([
    {
      recipient: traveler._id,
      type: 'trip_invite',
      title: 'Alex and Priya joined your trip',
      message: 'Alex Rivera and Priya Nair joined "Himalayan Ridge & Old Manali Explorer".',
      linkUrl: `/trips/${trip1._id}`,
    },
    {
      recipient: traveler._id,
      type: 'emergency_alert',
      title: 'Safety Readiness Verified',
      message: 'Emergency numbers (112, 108) and 2 trusted contacts configured.',
      linkUrl: '/profile',
    },
  ]);

  console.log('\n=============================================');
  console.log('✅ TRIPSO DEMO SEED COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
  console.log('🔑 Login Credentials:');
  console.log('   Email:    traveler@tripsos.org');
  console.log('   Password: TripSOS2026!');
  console.log('   Trip Code: TRP-82K7');
  console.log('=============================================\n');

  await disconnectDatabase();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
