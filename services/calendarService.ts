import { driveService } from './driveService';

class CalendarService {
    private get headers() {
        return {
            'Authorization': `Bearer ${driveService.currentToken}`,
            'Content-Type': 'application/json',
        };
    }

    async getUpcomingEvents(timeMin: string, timeMax: string) {
        if (!driveService.hasRealAccess) {
            return { success: false, message: 'Google Calendar API token not configured or missing.' };
        }
        try {
            const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;
            const response = await fetch(url, { headers: this.headers });
            if (!response.ok) {
                throw new Error(`Calendar API Error: ${response.statusText}`);
            }
            const data = await response.json();
            return { success: true, events: data.items };
        } catch (error: any) {
            console.error("Error fetching calendar events:", error);
            return { success: false, message: error.message };
        }
    }

    async createEvent(summary: string, date: string, description: string) {
        if (!driveService.hasRealAccess) {
            return { success: false, message: 'Google Calendar API token not configured or missing.' };
        }

        try {
            const isDateOnly = date.length === 10; // e.g. "2024-03-15"
            const event: any = {
                summary,
                description,
            };

            if (isDateOnly) {
                event.start = { date: date };
                // For all day events, end date is exclusive, so add 1 day
                const endDay = new Date(date);
                endDay.setDate(endDay.getDate() + 1);
                event.end = { date: endDay.toISOString().split('T')[0] };
            } else {
                // Assume full datetime
                event.start = { dateTime: date };
                const endDate = new Date(date);
                endDate.setHours(endDate.getHours() + 1); // Default 1 hr
                event.end = { dateTime: endDate.toISOString() };
            }

            const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(`Calendar API Error: ${JSON.stringify(err)}`);
            }
            const data = await response.json();
            return { success: true, eventLink: data.htmlLink, message: `Событие "${summary}" успешно создано в календаре.` };
        } catch (error: any) {
            console.error("Error creating calendar event:", error);
            return { success: false, message: error.message };
        }
    }
}

export const calendarService = new CalendarService();
