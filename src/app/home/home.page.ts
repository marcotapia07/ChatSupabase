// src/app/home/home.page.ts

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { SupabaseService } from '../services/supabase.service';
import { RealtimeChannel } from '@supabase/supabase-js'; // Importa RealtimeChannel
import { Router } from '@angular/router';

// Define la interfaz para la estructura de un mensaje, incluyendo el perfil del remitente
interface Message {
  id: string; // El ID del mensaje ahora es UUID
  user_id: string;
  content: string;
  created_at: string;
  profiles?: { username: string }; // Propiedad opcional para el nombre de usuario del remitente
}

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild(IonContent) content!: IonContent; // Referencia al IonContent para hacer scroll

  messages: Message[] = []; // Array para almacenar los mensajes del chat
  newMessage = ''; // Modelo para el input del nuevo mensaje
  currentUserId: string | null = null; // ID del usuario actualmente logueado
  private messageSubscription: RealtimeChannel | undefined; // Suscripción al canal de Realtime de Supabase

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  async ngOnInit() {
    // 1. Obtener la sesión del usuario actual
    const { data: { session } } = await this.supabaseService.getSession();
    if (session) {
      this.currentUserId = session.user.id;
    } else {
      // Si no hay sesión, redirigir al usuario a la página de login
      this.router.navigateByUrl('/login', { replaceUrl: true });
      return; // Salir de ngOnInit si no hay sesión
    }

    // 2. Cargar los mensajes existentes al iniciar el componente
    await this.loadMessages();

    // 3. Suscribirse a los nuevos mensajes en tiempo real
    this.subscribeToNewMessages();
  }

  ngOnDestroy() {
    // 4. Limpiar la suscripción de Realtime al destruir el componente para evitar fugas de memoria
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  async loadMessages() {
    // Carga todos los mensajes de la base de datos, incluyendo el nombre de usuario del remitente
    const { data, error } = await this.supabaseService.supabase
      .from('messages')
      .select(`
        *,
        profiles (username)
      `)
      .order('created_at', { ascending: true }); // Ordena por fecha de creación ascendente

    if (error) {
      console.error('Error al cargar mensajes iniciales:', error.message);
    } else {
      // Asigna los mensajes cargados al array local
      this.messages = data || [];
      // Asegura que la vista se desplace al final después de cargar los mensajes
      this.scrollToBottom();
    }
  }

  async sendMessage() {
    // Verifica que haya contenido y que el usuario esté logueado
    if (!this.newMessage.trim() || !this.currentUserId) {
      return;
    }

    // Inserta el nuevo mensaje en la tabla 'messages' de Supabase
    const { error } = await this.supabaseService.supabase
      .from('messages')
      .insert({
        user_id: this.currentUserId, // ID del usuario actual como remitente
        content: this.newMessage.trim() // Contenido del mensaje, sin espacios extra
      });

    if (error) {
      console.error('Error al enviar mensaje:', error.message);
    } else {
      this.newMessage = ''; // Limpia el input del mensaje
      // IMPORTANTE: No necesitamos llamar a loadMessages() aquí.
      // El mecanismo de Realtime se encargará de añadir el mensaje a la lista
      // y de hacer scroll al final en todos los clientes conectados.
    }
  }

  subscribeToNewMessages() {
    // Crea una suscripción al canal 'messages' para escuchar cambios en la tabla 'messages'
    this.messageSubscription = this.supabaseService.supabase
      .channel('public:messages') // Nombre del canal (generalmente el nombre de la tabla)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' }, // Escucha SÓLO eventos de INSERCIÓN
        async (payload) => {
          // El 'payload.new' contiene los datos de la fila recién insertada
          const newMessageData = payload.new as Message;

          // Supabase Realtime no incluye automáticamente datos de tablas relacionadas (JOINs)
          // en el payload. Por lo tanto, necesitamos obtener el nombre de usuario por separado
          // para que aparezca en el chat sin tener que recargar todos los mensajes.
          const { data: profileData, error: profileError } = await this.supabaseService.supabase
            .from('profiles')
            .select('username')
            .eq('id', newMessageData.user_id) // Busca el perfil por el user_id del nuevo mensaje
            .single(); // Espera un solo resultado

          if (profileError) {
            console.error('Error al obtener perfil en tiempo real:', profileError.message);
            // Si hay un error al obtener el perfil, al menos añade el mensaje sin el nombre de usuario
            this.messages.push(newMessageData);
          } else {
            // Construye el objeto de mensaje completo con el nombre de usuario
            const fullNewMessage: Message = {
              ...newMessageData,
              profiles: profileData ? { username: profileData.username } : undefined
            };
            // Añade el nuevo mensaje al array local `this.messages`
            this.messages.push(fullNewMessage);
          }

          // Asegura que la vista se desplace al final para mostrar el nuevo mensaje
          this.scrollToBottom();
        }
      )
      .subscribe(); // Esto inicia la escucha del canal de Realtime
  }

  async signOut() {
    await this.supabaseService.signOut(); // Cierra la sesión del usuario
    this.router.navigateByUrl('/login', { replaceUrl: true }); // Redirige al login
  }

  scrollToBottom() {
    // Pequeño retraso para asegurar que el DOM se ha actualizado antes de intentar hacer scroll
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToBottom(300); // Desplaza suavemente al final del contenido
      }
    }, 100);
  }
}