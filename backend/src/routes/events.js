const express = require('express');
const router = express.Router();

const db = require('../config/database');
const { verifyToken, requireRole } = require('../middleware/auth');

// FORMAT EVENT

function formatEvent(event) {
  if (!event) return null;

  return {
    ...event,
    name: event.title,
    eventDate: event.date,
    location: event.venue
  };
}

// GET ALL EVENTS
// Public to authenticated users

router.get('/', verifyToken, (req, res) => {
  try {
    const events = db
      .prepare(`
        SELECT *
        FROM events
        ORDER BY date ASC
      `)
      .all();

    res.json(events.map(formatEvent));

  } catch (error) {
    console.error('Get events error:', error);

    res.status(500).json({
      message: 'Failed to retrieve events'
    });
  }
});

// GET SINGLE EVENT

router.get('/:id', verifyToken, (req, res) => {
  try {
    const eventId = Number(req.params.id);

    const event = db
      .prepare('SELECT * FROM events WHERE id = ?')
      .get(eventId);

    if (!event) {
      return res.status(404).json({
        message: 'Event not found'
      });
    }

    res.json(formatEvent(event));

  } catch (error) {
    console.error('Get event error:', error);

    res.status(500).json({
      message: 'Failed to retrieve event'
    });
  }
});

// CREATE EVENT
// ADMIN ONLY

router.post(
  '/',
  verifyToken,
  requireRole('admin'),
  (req, res) => {
    try {
      const {
        title,
        name,
        category,
        description,
        date,
        eventDate,
        time,
        venue,
        location,
        organizer
      } = req.body;

      const finalTitle = (title || name || '').trim();
      const finalCategory = (category || 'Technical').trim();
      const finalDescription = (description || '').trim();
      const finalDate = date || eventDate;
      const finalTime = (time || '10:00 AM').trim();
      const finalVenue = (venue || location || '').trim();
      const finalOrganizer =
        (organizer || 'IIIT Allahabad').trim();

      if (!finalTitle) {
        return res.status(400).json({
          message: 'Event title is required'
        });
      }

      if (!finalDate) {
        return res.status(400).json({
          message: 'Event date is required'
        });
      }

      if (!finalVenue) {
        return res.status(400).json({
          message: 'Event venue is required'
        });
      }

      if (!finalDescription) {
        return res.status(400).json({
          message: 'Event description is required'
        });
      }

      const result = db
        .prepare(`
          INSERT INTO events
          (
            title,
            description,
            category,
            date,
            time,
            venue,
            organizer
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          finalTitle,
          finalDescription,
          finalCategory,
          finalDate,
          finalTime,
          finalVenue,
          finalOrganizer
        );

      const createdEvent = db
        .prepare('SELECT * FROM events WHERE id = ?')
        .get(result.lastInsertRowid);

      res.status(201).json({
        message: 'Event created successfully',
        eventId: result.lastInsertRowid,
        event: formatEvent(createdEvent)
      });

    } catch (error) {
      console.error('Create event error:', error);

      res.status(500).json({
        message: 'Failed to create event',
        error: error.message
      });
    }
  }
);

// UPDATE EVENT
// ADMIN ONLY

router.put(
  '/:id',
  verifyToken,
  requireRole('admin'),
  (req, res) => {
    try {
      const eventId = Number(req.params.id);

      const existingEvent = db
        .prepare('SELECT * FROM events WHERE id = ?')
        .get(eventId);

      if (!existingEvent) {
        return res.status(404).json({
          message: 'Event not found'
        });
      }

      const {
        title,
        name,
        category,
        description,
        date,
        eventDate,
        time,
        venue,
        location,
        organizer
      } = req.body;

      const finalTitle =
        (title || name || existingEvent.title).trim();

      const finalCategory =
        (category || existingEvent.category).trim();

      const finalDescription =
        (description || existingEvent.description).trim();

      const finalDate =
        date || eventDate || existingEvent.date;

      const finalTime =
        (time || existingEvent.time).trim();

      const finalVenue =
        (venue || location || existingEvent.venue).trim();

      const finalOrganizer =
        (organizer || existingEvent.organizer).trim();

      db
        .prepare(`
          UPDATE events
          SET
            title = ?,
            category = ?,
            description = ?,
            date = ?,
            time = ?,
            venue = ?,
            organizer = ?
          WHERE id = ?
        `)
        .run(
          finalTitle,
          finalCategory,
          finalDescription,
          finalDate,
          finalTime,
          finalVenue,
          finalOrganizer,
          eventId
        );

      const updatedEvent = db
        .prepare('SELECT * FROM events WHERE id = ?')
        .get(eventId);

      res.json({
        message: 'Event updated successfully',
        event: formatEvent(updatedEvent)
      });

    } catch (error) {
      console.error('Update event error:', error);

      res.status(500).json({
        message: 'Failed to update event',
        error: error.message
      });
    }
  }
);

// DELETE EVENT
// ADMIN ONLY

router.delete(
  '/:id',
  verifyToken,
  requireRole('admin'),
  (req, res) => {
    try {
      const eventId = Number(req.params.id);

      const event = db
        .prepare('SELECT * FROM events WHERE id = ?')
        .get(eventId);

      if (!event) {
        return res.status(404).json({
          message: 'Event not found'
        });
      }

      db
        .prepare('DELETE FROM events WHERE id = ?')
        .run(eventId);

      res.json({
        message: 'Event deleted successfully'
      });

    } catch (error) {
      console.error('Delete event error:', error);

      res.status(500).json({
        message: 'Failed to delete event'
      });
    }
  }
);

module.exports = router;