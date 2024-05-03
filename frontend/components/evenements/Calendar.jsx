'use client'
import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import momentPlugin from '@fullcalendar/moment'
import dayGridPlugin from '@fullcalendar/daygrid'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import timeGridPlugin from '@fullcalendar/timegrid'
import frLocale from '@fullcalendar/core/locales/fr'
import listPlugin from '@fullcalendar/list'
import Swal from 'sweetalert2'

const addOneDay = (dateString) => {
  const date = new Date(dateString)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

export default function Calendar () {
  const [events, setEvents] = useState([])

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:1337/api/calendar-events')
        const data = await response.json()

        const formattedEvents = data.data.map(event => ({
          title: event.attributes.title,
          start: event.attributes.date_debut,
          end: addOneDay(event.attributes.date_fin),
          id: event.id
        }))

        setEvents(formattedEvents)
      } catch (error) {
        console.error('Erreur lors de la récupération des événements :', error)
      }
    }

    fetchEvents()
  }, [])

  const handleEventClick = clickInfo => {
    Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Voulez-vous supprimer cet événement ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2fb8c5',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimez-le!',
      cancelButtonText: 'Non, annulez!'
    }).then(async (result) => {
      if (result.value) {
        try {
          await fetch(`http://localhost:1337/api/calendar-events/${clickInfo.event.id}`, {
            method: 'DELETE'
          })
          clickInfo.event.remove()
          Swal.fire('Supprimé!', 'Votre événement a été supprimé.', 'success')
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'événement :', error)
        }
      }
    })
  }

  const handleDateSelect = async selectInfo => {
    const { startStr, endStr, allDay } = selectInfo
    Swal.fire({
      title: 'Créer un événement',
      input: 'text',
      inputAttributes: {
        autocapitalize: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'Créer',
      confirmButtonColor: '#2fb8c5',
      cancelButtonText: 'Annuler',
      showLoaderOnConfirm: true,
      preConfirm: async eventName => {
        if (!eventName) {
          Swal.showValidationMessage('Veuillez entrer le nom de l\'événement')
          return
        }

        const newEvent = {
          title: eventName,
          date_debut: startStr,
          date_fin: endStr,
          allDay
        }

        try {
          const response = await fetch('http://localhost:1337/api/calendar-events', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data: newEvent })
          })
          const result = await response.json()
          const createdEvent = {
            ...newEvent,
            id: result.data.id
          }

          const calendarApi = selectInfo.view.calendar
          calendarApi.addEvent(createdEvent)
          setEvents([...events, createdEvent])

          console.log('Événement ajouté:', createdEvent) // Vérification de l'événement ajouté

          Swal.fire('Événement créé!')
        } catch (error) {
          console.error('Erreur lors de la création de l\'événement :', error)
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    })
  }

  return (
    <FullCalendar
      locale={frLocale}
      schedulerLicenseKey='CC-Attribution-NonCommercial-NoDerivatives'
      plugins={[
        dayGridPlugin,
        resourceTimelinePlugin,
        resourceTimeGridPlugin,
        interactionPlugin,
        timeGridPlugin,
        momentPlugin,
        listPlugin
      ]}
      headerToolbar={{
        left: 'prev,next today',
        center: 'dayGridMonth listMonth',
        right: 'title'
      }}
      events={[
        ...events
      ]}
      eventColor='#2fb8c5'
      initialView='dayGridMonth' // Affichage de base
      editable // Pour activer les interactions d'events
      droppable // Pour activer le fait d'ajouter un élement via le drag&drop
      nowIndicator
      dayMaxEvents
      selectMirror
      height={850}
      selectable
      dayCellContent={renderDayCellContent}
      select={handleDateSelect}
      eventClick={handleEventClick}
    />
  )
}

function renderDayCellContent (dayCell) {
  const isToday = dayCell.isToday
  const dayCellStyle = isToday ? { backgroundColor: '#46c1ca', color: 'white' } : {}

  return (
    <div style={dayCellStyle} className='p-1 rounded-full'>
      <div className='rounded-full h-6 w-6 flex items-center justify-center' style={isToday ? { color: 'white' } : {}}>
        {dayCell.dayNumberText}
      </div>
    </div>
  )
}
