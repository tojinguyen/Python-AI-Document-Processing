from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, LoginSerializer, ProfileSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

User = get_user_model()

# Register
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        responses={
            201: openapi.Response(
                description="Đăng ký thành công"
            ),
            400: openapi.Response(
                description="Dữ liệu đăng ký không hợp lệ"
            )
        },
        security=[]
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

#Login
class LoginView(APIView):
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    @swagger_auto_schema(
        request_body=LoginSerializer,
        responses={
            200: openapi.Response(
                description="Đăng nhập thành công",
                examples={
                    "application/json": {
                        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                    }
                }
            ),
            400: openapi.Response(
                description="Thông tin đăng nhập không hợp lệ",
                examples={
                    "application/json": {
                        "error": "Invalid credentials"
                    }
                }
            )
        },
        security=[]
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            }, status=status.HTTP_200_OK)
            
        return Response({"error": "Invalid credentials"}, status=400)

# Profile
class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @swagger_auto_schema(
        responses={200: ProfileSerializer()}
    )
    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)
        
    @swagger_auto_schema(
        request_body=ProfileSerializer,
        responses={200: ProfileSerializer()}
    )
    def put(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
