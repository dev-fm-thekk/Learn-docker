import { Router } from 'express';
import { db } from '../db/index.js';
import { todos } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

const todoRouter = Router();

// GET /todo — List all todos
todoRouter.get('/', async (req, res) => {
  try {
    const allTodos = await db.select().from(todos).orderBy(desc(todos.createdAt));
    res.json(allTodos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// GET /todo/:id — Get a single todo
todoRouter.get('/:id', async (req, res) => {
  try {
    const [todo] = await db.select().from(todos).where(eq(todos.id, parseInt(req.params.id)));
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// POST /todo — Create a new todo
todoRouter.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const [todo] = await db.insert(todos).values({ title, description }).returning();
    res.status(201).json(todo);
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// PATCH /todo/:id — Update a todo
todoRouter.patch('/:id', async (req, res) => {
  try {
    const { title, description, completed } = req.body;
    const updateData = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (completed !== undefined) updateData.completed = completed;

    const [todo] = await db.update(todos)
      .set(updateData)
      .where(eq(todos.id, parseInt(req.params.id)))
      .returning();
      
    if (!todo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.json(todo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE /todo/:id — Delete a todo
todoRouter.delete('/:id', async (req, res) => {
  try {
    const [deletedTodo] = await db.delete(todos).where(eq(todos.id, parseInt(req.params.id))).returning();
    if (!deletedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default todoRouter;
