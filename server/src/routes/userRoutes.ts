import mongoose from 'mongoose';
import { Router } from 'express';
import { EmergencyContact } from '../models/EmergencyContact.js';
import { User } from '../models/User.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { publicUser } from '../services/authService.js';
import { AppError } from '../types/errors.js';
import {
  createEmergencyContactSchema,
  updateEmergencyContactSchema,
  updateProfileSchema,
} from '../validators/userValidators.js';

export const userRoutes = Router();
userRoutes.use(requireAuth);

function publicContact(
  contact: import('../models/EmergencyContact.js').EmergencyContactRecord & {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  },
) {
  return {
    _id: contact._id.toString(),
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship,
    isPrimary: contact.isPrimary,
    priority: contact.priority ?? 1,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

userRoutes.get('/me', async (req, res, next) => {
  try {
    const user = await User.findById(req.auth!.userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Account not found.');
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

userRoutes.patch('/me', async (req, res, next) => {
  try {
    const input = updateProfileSchema.parse(req.body);
    const user = await User.findById(req.auth!.userId);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'Account not found.');
    if (input.name !== undefined) user.name = input.name;
    if (input.profilePhoto !== undefined) user.profilePhoto = input.profilePhoto;
    if (input.language !== undefined) user.language = input.language;
    if (input.travelPreferences) {
      user.travelPreferences = {
        ...user.travelPreferences,
        ...input.travelPreferences,
      };
    }
    await user.save();
    res.json({ success: true, data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
});

userRoutes.get('/me/emergency-contacts', async (req, res, next) => {
  try {
    const contacts = await EmergencyContact.find({ userId: req.auth!.userId }).sort({
      isPrimary: -1,
      priority: 1,
      createdAt: 1,
    });
    res.json({ success: true, data: { contacts: contacts.map(publicContact) } });
  } catch (error) {
    next(error);
  }
});

userRoutes.post('/me/emergency-contacts', async (req, res, next) => {
  try {
    const input = createEmergencyContactSchema.parse(req.body);
    const hasContacts = await EmergencyContact.exists({ userId: req.auth!.userId });
    const contact = new EmergencyContact({
      ...input,
      isPrimary: input.isPrimary || !hasContacts,
      userId: req.auth!.userId,
    });
    if (contact.isPrimary) {
      await EmergencyContact.updateMany(
        { userId: req.auth!.userId },
        { $set: { isPrimary: false } },
      );
    }
    await contact.save();
    res.status(201).json({ success: true, data: { contact: publicContact(contact) } });
  } catch (error) {
    next(error);
  }
});

userRoutes.patch('/me/emergency-contacts/:contactId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contactId)) {
      throw new AppError(404, 'CONTACT_NOT_FOUND', 'Emergency contact not found.');
    }
    const input = updateEmergencyContactSchema.parse(req.body);
    const contact = await EmergencyContact.findOne({
      _id: req.params.contactId,
      userId: req.auth!.userId,
    });
    if (!contact) throw new AppError(404, 'CONTACT_NOT_FOUND', 'Emergency contact not found.');
    if (input.isPrimary === true) {
      await EmergencyContact.updateMany(
        { userId: req.auth!.userId },
        { $set: { isPrimary: false } },
      );
    }
    Object.assign(contact, input);
    await contact.save();
    res.json({ success: true, data: { contact: publicContact(contact) } });
  } catch (error) {
    next(error);
  }
});

userRoutes.delete('/me/emergency-contacts/:contactId', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.contactId)) {
      throw new AppError(404, 'CONTACT_NOT_FOUND', 'Emergency contact not found.');
    }
    const deleted = await EmergencyContact.findOneAndDelete({
      _id: req.params.contactId,
      userId: req.auth!.userId,
    });
    if (!deleted) throw new AppError(404, 'CONTACT_NOT_FOUND', 'Emergency contact not found.');
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
});
