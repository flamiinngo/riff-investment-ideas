CREATE TRIGGER prevent_published_idea_update
BEFORE UPDATE ON ideas
BEGIN
	SELECT RAISE(ABORT, 'published ideas are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER prevent_published_idea_delete
BEFORE DELETE ON ideas
BEGIN
	SELECT RAISE(ABORT, 'published ideas are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER prevent_published_allocation_update
BEFORE UPDATE ON idea_allocations
BEGIN
	SELECT RAISE(ABORT, 'published allocations are immutable');
END;
--> statement-breakpoint
CREATE TRIGGER prevent_published_allocation_delete
BEFORE DELETE ON idea_allocations
BEGIN
	SELECT RAISE(ABORT, 'published allocations are immutable');
END;
--> statement-breakpoint
PRAGMA optimize;
