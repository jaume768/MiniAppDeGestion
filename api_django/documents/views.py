import logging
from django.http import HttpResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from accounts.permissions import HasEmpresaPermission
from .models import DocumentoPDF
from .serializers import DocumentoPDFSerializer, EnviarEmailSerializer
from .services import DocumentPDFService

logger = logging.getLogger(__name__)


class DocumentoPDFViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar PDFs de documentos"""
    
    queryset = DocumentoPDF.objects.all()
    serializer_class = DocumentoPDFSerializer
    permission_classes = [IsAuthenticated, HasEmpresaPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    
    # Filtros
    filterset_fields = [
        'content_type__model',  # Filtrar por tipo de documento
        'enviado_por_email',    # Filtrar por enviados/no enviados
        'version'               # Filtrar por versión
    ]
    
    # Búsqueda
    search_fields = [
        'nombre_archivo',
        'email_destinatario',
        'documento_origen__numero'  # Buscar por número de documento
    ]
    
    # Ordenamiento
    ordering_fields = ['created_at', 'updated_at', 'nombre_archivo', 'contador_envios']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """Filtrar PDFs por empresa del usuario"""
        queryset = DocumentoPDF.objects.filter(
            empresa=self.request.user.empresa
        )
        
        # Filtro adicional por tipo de documento si se especifica
        tipo_documento = self.request.query_params.get('tipo_documento')
        if tipo_documento:
            queryset = queryset.filter(content_type__model=tipo_documento.lower())
        
        return queryset.select_related('content_type', 'empresa')
    
    @action(detail=True, methods=['get'])
    def descargar(self, request, pk=None):
        """Descargar PDF"""
        documento_pdf = self.get_object()
        
        try:
            if not documento_pdf.archivo_pdf:
                return Response(
                    {'error': 'Archivo PDF no encontrado'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Abrir y leer el archivo PDF
            response = HttpResponse(
                documento_pdf.archivo_pdf.read(),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{documento_pdf.nombre_archivo}"'
            
            logger.info(f"PDF descargado: {documento_pdf.nombre_archivo} por usuario {request.user.id}")
            return response
            
        except Exception as e:
            logger.error(f"Error descargando PDF {documento_pdf.id}: {str(e)}")
            return Response(
                {'error': 'Error al descargar el archivo'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def ver(self, request, pk=None):
        """Ver PDF en el navegador (inline)"""
        documento_pdf = self.get_object()
        
        try:
            if not documento_pdf.archivo_pdf:
                raise Http404("Archivo PDF no encontrado")
            
            # Mostrar PDF en el navegador
            response = HttpResponse(
                documento_pdf.archivo_pdf.read(),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'inline; filename="{documento_pdf.nombre_archivo}"'
            
            return response
            
        except Exception as e:
            logger.error(f"Error mostrando PDF {documento_pdf.id}: {str(e)}")
            raise Http404("Error al mostrar el archivo")
    
    @action(detail=True, methods=['post'])
    def enviar_email(self, request, pk=None):
        """Enviar PDF por email"""
        documento_pdf = self.get_object()
        serializer = EnviarEmailSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            email_destinatario = serializer.validated_data['email_destinatario']
            asunto = serializer.validated_data.get('asunto')
            mensaje = serializer.validated_data.get('mensaje')
            solo_enlace = not serializer.validated_data.get('incluir_enlace_descarga', True)
            
            # Enviar email usando el servicio
            success = DocumentPDFService.enviar_por_email(
                documento_pdf=documento_pdf,
                email_destinatario=email_destinatario,
                asunto=asunto,
                mensaje=mensaje,
                solo_enlace=solo_enlace
            )
            
            if success:
                return Response({
                    'message': f'PDF enviado exitosamente a {email_destinatario}',
                    'enviado_a': email_destinatario,
                    'contador_envios': documento_pdf.contador_envios
                })
            else:
                return Response(
                    {'error': 'Error al enviar el email'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
        except Exception as e:
            logger.error(f"Error enviando email para PDF {documento_pdf.id}: {str(e)}")
            return Response(
                {'error': f'Error al enviar email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def estadisticas(self, request):
        """Obtener estadísticas de PDFs generados"""
        queryset = self.get_queryset()
        
        stats = {
            'total_pdfs': queryset.count(),
            'enviados_por_email': queryset.filter(enviado_por_email=True).count(),
            'no_enviados': queryset.filter(enviado_por_email=False).count(),
            'total_envios': sum(queryset.values_list('contador_envios', flat=True)),
            'por_tipo_documento': {},
            'tamaño_total_mb': round(
                sum(queryset.values_list('tamaño_archivo', flat=True)) / (1024 * 1024), 2
            )
        }
        
        # Estadísticas por tipo de documento
        for pdf in queryset.select_related('content_type'):
            tipo = pdf.content_type.model
            if tipo not in stats['por_tipo_documento']:
                stats['por_tipo_documento'][tipo] = {
                    'total': 0,
                    'enviados': 0,
                    'total_envios': 0
                }
            
            stats['por_tipo_documento'][tipo]['total'] += 1
            if pdf.enviado_por_email:
                stats['por_tipo_documento'][tipo]['enviados'] += 1
            stats['por_tipo_documento'][tipo]['total_envios'] += pdf.contador_envios
        
        return Response(stats)
