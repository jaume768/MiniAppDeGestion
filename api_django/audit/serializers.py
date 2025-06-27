from rest_framework import serializers
from .models import AuditLog, SecurityLog, PerformanceLog, BusinessEventLog

class AuditLogSerializer(serializers.ModelSerializer):
    user_display = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'action', 'action_display', 'level', 'level_display',
            'user', 'user_display', 'session_key', 'ip_address', 'user_agent',
            'content_type', 'object_id', 'table_name', 'record_id',
            'old_values', 'new_values', 'changes', 'description', 
            'module', 'business_context', 'empresa'
        ]
        read_only_fields = ['__all__']

class SecurityLogSerializer(serializers.ModelSerializer):
    user_display = serializers.CharField(source='user.username', read_only=True)
    event_display = serializers.CharField(source='get_event_display', read_only=True)
    risk_level_display = serializers.CharField(source='get_risk_level_display', read_only=True)
    
    class Meta:
        model = SecurityLog
        fields = [
            'id', 'timestamp', 'event', 'event_display', 'user', 'user_display',
            'username_attempted', 'ip_address', 'user_agent', 'referrer',
            'details', 'success', 'risk_level', 'risk_level_display', 'empresa'
        ]
        read_only_fields = ['__all__']

class PerformanceLogSerializer(serializers.ModelSerializer):
    user_display = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = PerformanceLog
        fields = [
            'id', 'timestamp', 'method', 'path', 'user', 'user_display',
            'response_time', 'db_queries_count', 'db_time', 'memory_usage',
            'is_slow', 'status_code', 'extra_data', 'empresa'
        ]
        read_only_fields = ['__all__']

class BusinessEventLogSerializer(serializers.ModelSerializer):
    user_display = serializers.CharField(source='user.username', read_only=True)
    event_display = serializers.CharField(source='get_event_display', read_only=True)
    
    class Meta:
        model = BusinessEventLog
        fields = [
            'id', 'timestamp', 'event', 'event_display', 'user', 'user_display',
            'description', 'data', 'amount', 'quantity', 'empresa'
        ]
        read_only_fields = ['__all__']

class AuditSummarySerializer(serializers.Serializer):
    """
    Serializer para resúmenes de auditoría
    """
    total_events = serializers.IntegerField()
    events_by_action = serializers.DictField()
    events_by_level = serializers.DictField()
    events_by_module = serializers.DictField()
    top_users = serializers.ListField()
    recent_events = AuditLogSerializer(many=True)
    
class SecuritySummarySerializer(serializers.Serializer):
    """
    Serializer para resúmenes de seguridad
    """
    total_events = serializers.IntegerField()
    successful_events = serializers.IntegerField()
    failed_events = serializers.IntegerField()
    events_by_risk = serializers.DictField()
    top_ips = serializers.ListField()
    failed_logins = serializers.IntegerField()
    recent_threats = SecurityLogSerializer(many=True)
