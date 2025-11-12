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
        preg_match_all('/\{([^}]+)\}/', $path, $matches);
        $paramNames = $matches[1] ?? [];

        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler,
            'paramNames' => $paramNames
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
            $routeParams = [];
            if ($route['method'] === $method && $this->matchPath($route['path'], $path, $routeParams)) {
                $this->executeHandler($route['handler'], $path, $routeParams);
                return;
            }
        }

        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Route not found'
        ]);
    }

    private function matchPath($routePath, $requestPath, &$routeParams = [])
    {
        $pattern = preg_replace('/\{([^}]+)\}/', '([^/]+)', $routePath);
        $pattern = '#^' . $pattern . '$#';

        if (preg_match($pattern, $requestPath, $matches)) {
            array_shift($matches);
            preg_match_all('/\{([^}]+)\}/', $routePath, $paramNames);
            $names = $paramNames[1] ?? [];
            $routeParams = [];
            foreach ($names as $index => $name) {
                if (isset($matches[$index])) {
                    $routeParams[$name] = $matches[$index];
                }
            }
            return true;
        }

        return false;
    }

    private function executeHandler($handler, $path, array $routeParams = [])
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
                        if (isset($routeParams['profile_url'])) {
                            $_GET['profile_url'] = $routeParams['profile_url'];
                        } else {
                            $pathParts = explode('/', trim($path, '/'));
                            if (count($pathParts) >= 2) {
                                $_GET['profile_url'] = $pathParts[1];
                            }
                        }
                    }
                    
                    // Extract filename parameter for uploads routes
                    if (strpos($path, '/uploads/') === 0) {
                        if (isset($routeParams['filename'])) {
                            $_GET['filename'] = $routeParams['filename'];
                        } else {
                            $pathParts = explode('/', trim($path, '/'));
                            if (count($pathParts) >= 3) {
                                $_GET['filename'] = $pathParts[2];
                            }
                        }
                    }
                    call_user_func_array([$controller, $method], array_values($routeParams));
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