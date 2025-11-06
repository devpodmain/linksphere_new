<?php

namespace App\Core;

class Router
{
    private $routes = [];

    public function get($path, $handler)
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post($path, $handler)
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put($path, $handler)
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete($path, $handler)
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute($method, $path, $handler)
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
        
    }

    public function dispatch()
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        
        // Remove project path prefixes for different environments
        // Development: /linksphere/backend
        // Production: /backend/ or /00webapp/qr/backend/
        $path = preg_replace('#^/linksphere/backend/public#', '', $path);
        $path = preg_replace('#^/linksphere/backend#', '', $path);
        $path = preg_replace('#^/backend/public#', '', $path);
        $path = preg_replace('#^/backend#', '', $path);
        $path = preg_replace('#^/00webapp/qr/backend/public#', '', $path);
        $path = preg_replace('#^/00webapp/qr/backend#', '', $path);
        
        // Remove /api prefix if present
        $path = str_replace('/api', '', $path);
        
        // Ensure path starts with /
        if (!empty($path) && $path[0] !== '/') {
            $path = '/' . $path;
        }
        
        foreach ($this->routes as $route) {
            if ($route['method'] === $method && $this->matchPath($route['path'], $path)) {
                $this->executeHandler($route['handler'], $path);
                return;
            }
        }

        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Route not found'
        ]);
    }

    private function matchPath($routePath, $requestPath)
    {
        // Convert route path to regex
        $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';
        
        return preg_match($pattern, $requestPath);
    }

    private function executeHandler($handler, $path)
    {
        if (is_string($handler)) {
            // Format: "Controller@method"
            list($controllerName, $method) = explode('@', $handler);
            $controllerClass = "App\\Controllers\\{$controllerName}";
            
            if (class_exists($controllerClass)) {
                $controller = new $controllerClass();
                if (method_exists($controller, $method)) {
                    // Extract route parameters for profile URL
                    if (strpos($path, '/profiles/') === 0) {
                        $pathParts = explode('/', trim($path, '/'));
                        if (count($pathParts) >= 2) {
                            $_GET['profile_url'] = $pathParts[1];
                        }
                    }
                    
                    // Extract filename parameter for uploads routes
                    if (strpos($path, '/uploads/') === 0) {
                        $pathParts = explode('/', trim($path, '/'));
                        if (count($pathParts) >= 3) {
                            $_GET['filename'] = $pathParts[2];
                        }
                    }
                    $controller->$method();
                } else {
                    throw new \Exception("Method {$method} not found in {$controllerClass}");
                }
            } else {
                throw new \Exception("Controller {$controllerClass} not found");
            }
        } elseif (is_callable($handler)) {
            call_user_func($handler);
        }
    }
}