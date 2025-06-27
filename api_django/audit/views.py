from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import AuditLog, SecurityLog, PerformanceLog, BusinessEventLog
from .serializers import (
    AuditLogSerializer, SecurityLogSerializer, PerformanceLogSerializer,
    BusinessEventLogSerializer, AuditSummarySerializer, SecuritySummarySerializer
)

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para logs de auditoría - Solo lectura
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['action', 'level', 'module', 'table_name', 'user']
    search_fields = ['description', 'table_name']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        return AuditLog.objects.filter(empresa=self.request.user.empresa)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Resumen de actividad de auditoría
        """
        queryset = self.get_queryset()
        
        # Filtros de fecha
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(timestamp__gte=start_date)
        
        # Estadísticas
        total_events = queryset.count()
        
        events_by_action = dict(
            queryset.values('action').annotate(count=Count('id')).values_list('action', 'count')
        )
        
        events_by_level = dict(
            queryset.values('level').annotate(count=Count('id')).values_list('level', 'count')
        )
        
        events_by_module = dict(
            queryset.values('module').annotate(count=Count('id')).values_list('module', 'count')
        )
        
        # Top usuarios
        top_users = list(
            queryset.filter(user__isnull=False)
            .values('user__username')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
            .values_list('user__username', 'count')
        )
        
        # Eventos recientes
        recent_events = queryset[:10]
        
        summary_data = {
            'total_events': total_events,
            'events_by_action': events_by_action,
            'events_by_level': events_by_level,
            'events_by_module': events_by_module,
            'top_users': top_users,
            'recent_events': recent_events
        }
        
        serializer = AuditSummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def critical(self, request):
        """
        Solo eventos críticos
        """
        queryset = self.get_queryset().filter(level='CRITICAL')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class SecurityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para logs de seguridad - Solo lectura
    """
    serializer_class = SecurityLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['event', 'success', 'risk_level', 'ip_address']
    search_fields = ['username_attempted', 'ip_address']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        return SecurityLog.objects.filter(empresa=self.request.user.empresa)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Resumen de seguridad
        """
        queryset = self.get_queryset()
        
        # Filtros de fecha
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(timestamp__gte=start_date)
        
        total_events = queryset.count()
        successful_events = queryset.filter(success=True).count()
        failed_events = queryset.filter(success=False).count()
        
        events_by_risk = dict(
            queryset.values('risk_level').annotate(count=Count('id')).values_list('risk_level', 'count')
        )
        
        # Top IPs
        top_ips = list(
            queryset.values('ip_address')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
            .values_list('ip_address', 'count')
        )
        
        # Failed logins
        failed_logins = queryset.filter(event='LOGIN_FAILED').count()
        
        # Amenazas recientes
        recent_threats = queryset.filter(
            Q(risk_level__in=['HIGH', 'CRITICAL']) | Q(success=False)
        )[:10]
        
        summary_data = {
            'total_events': total_events,
            'successful_events': successful_events,
            'failed_events': failed_events,
            'events_by_risk': events_by_risk,
            'top_ips': top_ips,
            'failed_logins': failed_logins,
            'recent_threats': recent_threats
        }
        
        serializer = SecuritySummarySerializer(summary_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def threats(self, request):
        """
        Solo amenazas de seguridad
        """
        queryset = self.get_queryset().filter(
            Q(risk_level__in=['HIGH', 'CRITICAL']) | Q(success=False)
        )
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class PerformanceLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para logs de performance - Solo lectura
    """
    serializer_class = PerformanceLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['method', 'is_slow', 'status_code']
    search_fields = ['path']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        return PerformanceLog.objects.filter(empresa=self.request.user.empresa)
    
    @action(detail=False, methods=['get'])
    def slow_queries(self, request):
        """
        Solo queries lentas
        """
        queryset = self.get_queryset().filter(is_slow=True)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estadísticas de performance
        """
        queryset = self.get_queryset()
        
        # Filtros de fecha
        days = int(request.query_params.get('days', 7))
        start_date = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(timestamp__gte=start_date)
        
        from django.db.models import Avg, Max, Min
        
        stats = queryset.aggregate(
            avg_response_time=Avg('response_time'),
            max_response_time=Max('response_time'),
            min_response_time=Min('response_time'),
            avg_db_queries=Avg('db_queries_count'),
            max_db_queries=Max('db_queries_count'),
            total_slow=Count('id', filter=Q(is_slow=True)),
            total_requests=Count('id')
        )
        
        return Response(stats)

class BusinessEventLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para logs de eventos de negocio - Solo lectura
    """
    serializer_class = BusinessEventLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['event', 'user']
    search_fields = ['description']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        return BusinessEventLog.objects.filter(empresa=self.request.user.empresa)
    
    @action(detail=False, methods=['get'])
    def by_event(self, request):
        """
        Agrupa eventos por tipo
        """
        queryset = self.get_queryset()
        
        # Filtros de fecha
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(timestamp__gte=start_date)
        
        events_summary = {}
        for event_choice in BusinessEventLog.EVENT_CHOICES:
            event_code = event_choice[0]
            event_name = event_choice[1]
            
            count = queryset.filter(event=event_code).count()
            events_summary[event_code] = {
                'name': event_name,
                'count': count
            }
        
        return Response(events_summary)
