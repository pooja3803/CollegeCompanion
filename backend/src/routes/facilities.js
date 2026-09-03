const express = require('express');
const router = express.Router();

const db = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// FORMAT FACILITY


function formatFacility(facility) {
  if (!facility) return null;

  return {
    ...facility,
    title: facility.name,
    openingHours: facility.timings
  };
}

// GET ALL FACILITIES

router.get('/', verifyToken, (req, res) => {
  try {
    const facilities = db
      .prepare(`
        SELECT *
        FROM facilities
        ORDER BY category ASC, name ASC
      `)
      .all();

    res.json(facilities.map(formatFacility));

  } catch (error) {
    console.error('Get facilities error:', error);

    res.status(500).json({
      message: 'Failed to retrieve facilities'
    });
  }
});

// GET SINGLE FACILITY

router.get('/:id', verifyToken, (req, res) => {
  try {
    const facilityId = Number(req.params.id);

    const facility = db
      .prepare('SELECT * FROM facilities WHERE id = ?')
      .get(facilityId);

    if (!facility) {
      return res.status(404).json({
        message: 'Facility not found'
      });
    }

    res.json(formatFacility(facility));

  } catch (error) {
    console.error('Get facility error:', error);

    res.status(500).json({
      message: 'Failed to retrieve facility'
    });
  }
});

// CREATE FACILITY
// ADMIN ONLY


router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  (req, res) => {
    try {
      const {
        name,
        title,
        category,
        description,
        location,
        timings,
        openingHours
      } = req.body;

      const finalName = (name || title || '').trim();

      const finalCategory =
        (category || 'Academic & Labs').trim();

      const finalDescription =
        (description || '').trim();

      const finalLocation =
        (location || '').trim();

      const finalTimings =
        (timings ||
          openingHours ||
          '09:00 AM - 05:00 PM').trim();

      if (!finalName) {
        return res.status(400).json({
          message: 'Facility name is required'
        });
      }

      if (!finalLocation) {
        return res.status(400).json({
          message: 'Facility location is required'
        });
      }

      if (!finalDescription) {
        return res.status(400).json({
          message: 'Facility description is required'
        });
      }

      const result = db
        .prepare(`
          INSERT INTO facilities
          (
            name,
            category,
            description,
            location,
            timings
          )
          VALUES (?, ?, ?, ?, ?)
        `)
        .run(
          finalName,
          finalCategory,
          finalDescription,
          finalLocation,
          finalTimings
        );

      const createdFacility = db
        .prepare('SELECT * FROM facilities WHERE id = ?')
        .get(result.lastInsertRowid);

      res.status(201).json({
        message: 'Facility created successfully',
        facilityId: result.lastInsertRowid,
        facility: formatFacility(createdFacility)
      });

    } catch (error) {
      console.error('Create facility error:', error);

      res.status(500).json({
        message: 'Failed to create facility',
        error: error.message
      });
    }
  }
);

// UPDATE FACILITY
// ADMIN ONLY


router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  (req, res) => {
    try {
      const facilityId = Number(req.params.id);

      const existingFacility = db
        .prepare('SELECT * FROM facilities WHERE id = ?')
        .get(facilityId);

      if (!existingFacility) {
        return res.status(404).json({
          message: 'Facility not found'
        });
      }

      const {
        name,
        title,
        category,
        description,
        location,
        timings,
        openingHours
      } = req.body;

      const finalName =
        (name || title || existingFacility.name).trim();

      const finalCategory =
        (category || existingFacility.category).trim();

      const finalDescription =
        (description || existingFacility.description).trim();

      const finalLocation =
        (location || existingFacility.location).trim();

      const finalTimings =
        (
          timings ||
          openingHours ||
          existingFacility.timings
        ).trim();

      db
        .prepare(`
          UPDATE facilities
          SET
            name = ?,
            category = ?,
            description = ?,
            location = ?,
            timings = ?
          WHERE id = ?
        `)
        .run(
          finalName,
          finalCategory,
          finalDescription,
          finalLocation,
          finalTimings,
          facilityId
        );

      const updatedFacility = db
        .prepare('SELECT * FROM facilities WHERE id = ?')
        .get(facilityId);

      res.json({
        message: 'Facility updated successfully',
        facility: formatFacility(updatedFacility)
      });

    } catch (error) {
      console.error('Update facility error:', error);

      res.status(500).json({
        message: 'Failed to update facility',
        error: error.message
      });
    }
  }
);

// DELETE FACILITY
// ADMIN ONLY

router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  (req, res) => {
    try {
      const facilityId = Number(req.params.id);

      const facility = db
        .prepare('SELECT * FROM facilities WHERE id = ?')
        .get(facilityId);

      if (!facility) {
        return res.status(404).json({
          message: 'Facility not found'
        });
      }

      db
        .prepare('DELETE FROM facilities WHERE id = ?')
        .run(facilityId);

      res.json({
        message: 'Facility deleted successfully'
      });

    } catch (error) {
      console.error('Delete facility error:', error);

      res.status(500).json({
        message: 'Failed to delete facility'
      });
    }
  }
);

module.exports = router;