import { Router } from 'express';
import pool from '../db.js';

const router = Router();

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

router.use(requireAuth);

// GET /api/labels
router.get('/labels', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM labels ORDER BY is_default DESC, name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/labels
router.post('/labels', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    const result = await pool.query(
      'INSERT INTO labels (name, is_default) VALUES ($1, false) RETURNING *',
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Label already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes
router.get('/recipes', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*,
        COALESCE(
          json_agg(json_build_object('id', l.id, 'name', l.name))
          FILTER (WHERE l.id IS NOT NULL), '[]'
        ) AS labels
      FROM recipes r
      LEFT JOIN recipe_labels rl ON r.id = rl.recipe_id
      LEFT JOIN labels l ON rl.label_id = l.id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/recipes/:id
router.get('/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(`
      SELECT r.*,
        COALESCE(
          json_agg(json_build_object('id', l.id, 'name', l.name))
          FILTER (WHERE l.id IS NOT NULL), '[]'
        ) AS labels
      FROM recipes r
      LEFT JOIN recipe_labels rl ON r.id = rl.recipe_id
      LEFT JOIN labels l ON rl.label_id = l.id
      WHERE r.id = $1
      GROUP BY r.id
    `, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/recipes
router.post('/recipes', async (req, res) => {
  const { title, ingredients, instructions, image_url, prep_time, servings, label_ids } = req.body;
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const recipeResult = await client.query(
      `INSERT INTO recipes (user_id, title, ingredients, instructions, image_url, prep_time, servings)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.session.userId, title, ingredients, instructions,
       image_url || null, prep_time || null, servings || null]
    );
    const recipe = recipeResult.rows[0];
    if (label_ids && label_ids.length > 0) {
      for (const labelId of label_ids) {
        await client.query(
          'INSERT INTO recipe_labels (recipe_id, label_id) VALUES ($1, $2)',
          [recipe.id, labelId]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ ...recipe, labels: [] });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// PUT /api/recipes/:id
router.put('/recipes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, ingredients, instructions, image_url, prep_time, servings, label_ids } = req.body;
  if (!title || !ingredients || !instructions) {
    return res.status(400).json({ error: 'Title, ingredients, and instructions required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const recipeResult = await client.query(
      `UPDATE recipes
       SET title=$1, ingredients=$2, instructions=$3, image_url=$4, prep_time=$5, servings=$6
       WHERE id=$7 RETURNING *`,
      [title, ingredients, instructions, image_url || null,
       prep_time || null, servings || null, id]
    );
    if (recipeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Recipe not found' });
    }
    await client.query('DELETE FROM recipe_labels WHERE recipe_id = $1', [id]);
    if (label_ids && label_ids.length > 0) {
      for (const labelId of label_ids) {
        await client.query(
          'INSERT INTO recipe_labels (recipe_id, label_id) VALUES ($1, $2)',
          [id, labelId]
        );
      }
    }
    await client.query('COMMIT');
    res.json(recipeResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/recipes/:id
router.delete('/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM recipes WHERE id = $1 RETURNING id',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
