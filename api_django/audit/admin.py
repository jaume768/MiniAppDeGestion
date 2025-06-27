from django.contrib import admin
from django.utils.html import format_html
from .models import AuditLog, SecurityLog, PerformanceLog, BusinessEventLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'action', 'level', 'user', 'table_name', 
        'description_short', 'module', 'empresa'
    ]
    list_filter = [
        'action', 'level', 'module', 'timestamp', 'empresa'
    ]
    search_fields = [
        'description', 'table_name', 'user__username', 'user__email'
    ]
    readonly_fields = [
        'timestamp', 'action', 'level', 'user', 'session_key',
        'ip_address', 'user_agent', 'content_type', 'object_id',
        'table_name', 'record_id', 'old_values', 'new_values',
        'changes', 'description', 'module', 'business_context'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    def description_short(self, obj):
        return obj.description[:100] + '...' if len(obj.description) > 100 else obj.description
    description_short.short_description = 'Descripción'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
    
    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

@admin.register(SecurityLog)
class SecurityLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'event', 'user', 'username_attempted', 
        'ip_address', 'success', 'colored_risk_level', 'empresa'
    ]
    list_filter = [
        'event', 'success', 'risk_level', 'timestamp', 'empresa'
    ]
    search_fields = [
        'username_attempted', 'ip_address', 'user__username'
    ]
    readonly_fields = [
        'timestamp', 'event', 'user', 'username_attempted',
        'ip_address', 'user_agent', 'referrer', 'details',
        'success', 'risk_level'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    def colored_risk_level(self, obj):
        colors = {
            'LOW': 'green',
            'MEDIUM': 'orange', 
            'HIGH': 'red',
            'CRITICAL': 'darkred'
        }
        return format_html(
            '<span style="color: {};">{}</span>',
            colors.get(obj.risk_level, 'black'),
            obj.get_risk_level_display()
        )
    colored_risk_level.short_description = 'Nivel de Riesgo'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

@admin.register(PerformanceLog)
class PerformanceLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'method', 'path_short', 'user', 'response_time',
        'db_queries_count', 'is_slow', 'status_code', 'empresa'
    ]
    list_filter = [
        'method', 'is_slow', 'status_code', 'timestamp', 'empresa'
    ]
    search_fields = ['path', 'user__username']
    readonly_fields = [
        'timestamp', 'method', 'path', 'user', 'response_time',
        'db_queries_count', 'db_time', 'memory_usage', 'is_slow',
        'status_code', 'extra_data'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    def path_short(self, obj):
        return obj.path[:50] + '...' if len(obj.path) > 50 else obj.path
    path_short.short_description = 'Path'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False

@admin.register(BusinessEventLog)
class BusinessEventLogAdmin(admin.ModelAdmin):
    list_display = [
        'timestamp', 'event', 'user', 'description_short',
        'amount', 'quantity', 'empresa'
    ]
    list_filter = [
        'event', 'timestamp', 'empresa'
    ]
    search_fields = [
        'description', 'user__username', 'data'
    ]
    readonly_fields = [
        'timestamp', 'event', 'user', 'description',
        'data', 'amount', 'quantity'
    ]
    date_hierarchy = 'timestamp'
    ordering = ['-timestamp']
    
    def description_short(self, obj):
        return obj.description[:100] + '...' if len(obj.description) > 100 else obj.description
    description_short.short_description = 'Descripción'
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
